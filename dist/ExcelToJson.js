"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const path_1 = __importDefault(require("path"));
const JsonToTs_1 = require("./JsonToTs");
const main_1 = require("./main");
const fs = require('fs');
const excel = require('exceljs');
/**
 * Excel转Json数据
 * @param {*} src           读取的excel文件目录
 * @param {*} dst           导出的json文件目录
 * @param {*} name          excel文件名
 * @param {*} isClient      是否为客户端数据
 */
async function convert(src, dst, name, isClient) {
    let r = {};
    let names = []; // 文名字段名
    let keys = []; // 字段名
    let types = []; // 通用字段数据类型
    let types_client = {}; // 客户端数据类型
    let servers = []; // 是否输出服务器字段数据
    let clients = []; // 是否输出客户端字段数据
    let primary = []; // 多主键配置
    let primary_index = [];
    const workbook = new excel.Workbook();
    // 读取excel
    await workbook.xlsx.readFile(src);
    const worksheet = workbook.getWorksheet(1); // 获取第一个worksheet 
    worksheet.eachRow((row, rowNumber) => {
        let data = {};
        row.eachCell((cell, colNumber) => {
            const value = cell.text;
            // console.warn(cell.text, cell.string, cell.number, cell.result, cell.formula)
            if (rowNumber === 1) { // 字段中文名
                names.push(value);
                if (value.indexOf("【KEY】") > -1)
                    primary_index.push(colNumber);
            }
            else if (rowNumber === 2) { // 字段英文名
                keys.push(value);
                if (primary_index.indexOf(colNumber) > -1)
                    primary.push(value);
            }
            else if (rowNumber === 3) { // 通用字段数据类型
                types.push(value);
            }
            else if (isClient == false && rowNumber === 4) { // 是否输出服务器字段数据
                servers.push(value);
            }
            else if (isClient == true && rowNumber === 5) { // 客户端数据类型 
                clients.push(value);
            }
            else if (rowNumber > 5) {
                let index = colNumber - 1;
                let type = types[index];
                let server = servers[index];
                let client = clients[index];
                // 验证是否输出这个字段
                let isWrite = isClient && client === "client" || isClient == false && server === "server";
                if (isWrite) {
                    let key = keys[index];
                    switch (type) {
                        case "int":
                            // console.warn(`${index}int`, key, value, cell.string, cell.number, cell.result)
                            if (cell.formula) {
                                data[key] = parseInt(cell.result);
                            }
                            else {
                                data[key] = parseInt(value);
                            }
                            types_client[key] = {
                                en: "number",
                                zh: names[index]
                            };
                            break;
                        case "float":
                            // console.warn(`${index}int`, key, value, cell.string, cell.number, cell.result)
                            if (cell.formula) {
                                data[key] = parseFloat(cell.result);
                            }
                            else {
                                data[key] = parseFloat(value);
                            }
                            types_client[key] = {
                                en: "number",
                                zh: names[index]
                            };
                            break;
                        case "string":
                            // console.warn(`${index}int`, key, value, cell.string, cell.number, cell.result)
                            data[key] = value;
                            types_client[key] = {
                                en: "string",
                                zh: names[index]
                            };
                            break;
                        case "any":
                            // console.warn(`${index}int`, key, value, cell.string, cell.number, cell.result)
                            try {
                                data[key] = JSON.parse(value);
                                types_client[key] = {
                                    en: "any",
                                    zh: names[index]
                                };
                            }
                            catch (_a) {
                                console.log('Cell ' + cell.address + ' has value ' + cell.text);
                                console.warn(`文件【${src}】的【${key}】字段【${data[key]}】类型数据【${value}】JSON转字段串错误【${client}】`);
                            }
                            break;
                    }
                }
            }
        });
        // 生成数据（多主键）
        if (rowNumber > 5) {
            let temp = null;
            for (var i = 0; i < primary.length; i++) {
                let k = primary[i];
                let id = data[k];
                delete data[k]; // 主键数据删除
                if (primary.length == 1) {
                    r[id] = data;
                }
                else {
                    if (i == primary.length - 1) {
                        temp[id] = data;
                    }
                    else if (i == 0) {
                        if (r[id] == undefined) {
                            r[id] = {};
                        }
                        temp = r[id];
                    }
                    else {
                        temp[id] = {};
                        temp = temp[id];
                    }
                }
            }
        }
    });
    // 写入流
    if (r["undefined"] == null) {
        await fs.writeFileSync(dst, JSON.stringify(r));
        // 生成客户端脚本
        if (isClient) {
            (0, JsonToTs_1.createTsClient)(name, types_client, r, primary);
        }
        else {
            (0, JsonToTs_1.createTsServer)(name, types_client, r, primary);
        }
        console.log(isClient ? "客户端数据" : "服务器数据", "生成成功", dst);
    }
    else {
        console.log(isClient ? "客户端数据" : "服务器数据", "无数据", dst);
    }
}
function run() {
    var inputExcelPath = path_1.default.join(__dirname, main_1.config.PathExcel.replace("project://", "../../../") + "/");
    var outJsonPathClient = path_1.default.join(__dirname, main_1.config.PathJsonClient.replace("project://", "../../../") + "/");
    var outJsonPathServer = null;
    if (main_1.config.PathJsonServer != null && main_1.config.PathJsonServer.length > 0) {
        outJsonPathServer = path_1.default.join(__dirname, main_1.config.PathJsonServer.replace("project://", "../../../") + "/");
    }
    const files = fs.readdirSync(inputExcelPath);
    files.forEach((f) => {
        let name = f.substring(0, f.indexOf("."));
        let ext = f.toString().substring(f.lastIndexOf(".") + 1);
        if (ext == "xlsx") {
            if (outJsonPathServer)
                convert(inputExcelPath + f, outJsonPathServer + name + ".json", name, false); // 服务器数据
            convert(inputExcelPath + f, outJsonPathClient + name + ".json", name, true); // 客户端数据
        }
    });
}
exports.run = run;
