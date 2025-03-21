"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTsServer = exports.createTsClient = void 0;
/*
 * @Author: dgflash
 * @Date: 2022-07-26 18:21:52
 * @LastEditors: dgflash
 * @LastEditTime: 2023-07-27 09:33:29
 */
const path_1 = __importDefault(require("path"));
const main_1 = require("./main");
const fs = require('fs');
async function createTsClient(name, fieldType, data, primary) {
    // 主键参数
    var script_init_params = "";
    var script_init_data = "";
    var script_init_var = "";
    var script_init_value = "";
    primary.forEach(key => {
        script_init_params += `${key}: ${fieldType[key].en}, `;
        script_init_data += `[${key}]`;
        script_init_var += `/** ${fieldType[key].zh} */\r`;
        if (fieldType[key].en == "number") {
            script_init_var += `    ${key}: ${fieldType[key].en} = 0;\r    `;
        }
        else {
            script_init_var += `    ${key}: ${fieldType[key].en} = null!;\r    `;
        }
        script_init_value += `this.${key} = ${key};\r        `;
    });
    script_init_params = script_init_params.substring(0, script_init_params.length - 2);
    script_init_var = script_init_var.substring(0, script_init_var.length - 5);
    script_init_value = script_init_value.substring(0, script_init_value.length - 9);
    // 字段
    var field = "";
    for (var id in fieldType) {
        if (primary.indexOf(id) == -1) {
            field += `
    /** ${fieldType[id].zh} */
    get ${id}(): ${fieldType[id].en} {
        return this.data.${id};
    }`;
        }
    }
    var script = `
import { JsonUtil } from "db://oops-framework/core/utils/JsonUtil";

export class Table${name} {
    static TableName: string = "${name}";

    private data: any;

    init(${script_init_params}) {
        var table = JsonUtil.get(Table${name}.TableName);
        this.data = table${script_init_data};
        ${script_init_value}
    }

    ${script_init_var}
${field}
}
    `;
    var p = path_1.default.join(__dirname, main_1.config.PathTsClient.replace("project://", "../../../") + "/");
    await fs.writeFileSync(`${p}Table${name}.ts`, script);
}
exports.createTsClient = createTsClient;
async function createTsServer(name, fieldType, data, primary) {
    // 主键参数
    var script_init_params = "";
    var script_init_data = "";
    var script_init_var = "";
    var script_init_value = "";
    primary.forEach(key => {
        script_init_params += `${key}: number, `;
        script_init_data += `[${key}]`;
        script_init_var += `/** ${fieldType[key].zh} */
    ${key}: number = 0;\r    `;
        script_init_value += `this.${key} = ${key};\r        `;
    });
    script_init_params = script_init_params.substring(0, script_init_params.length - 2);
    script_init_var = script_init_var.substring(0, script_init_var.length - 5);
    script_init_value = script_init_value.substring(0, script_init_value.length - 9);
    // 字段
    var field = "";
    for (var id in fieldType) {
        if (primary.indexOf(id) == -1) {
            field += `
    /** ${fieldType[id].zh} */
    get ${id}(): ${fieldType[id].en} {
        return this.data.${id};
    }`;
        }
    }
    var script = `
export class Table${name} {
    static TableName: string = "/game/${name}.json";
    static Table: any = null!;

    static load() {
        var fs = require('fs');
        var data = fs.readFileSync(__dirname + this.TableName, 'utf8');
        this.Table = JSON.parse(data);
    }

    private data: any;

    init(${script_init_params}) {
        this.data = Table${name}.Table[id];
        ${script_init_value}
    }

    ${script_init_var}
${field}
}
    `;
    var p = path_1.default.join(__dirname, main_1.config.PathTsServer.replace("project://", "../../../") + "/");
    await fs.writeFileSync(`${p}Table${name}.ts`, script);
}
exports.createTsServer = createTsServer;
