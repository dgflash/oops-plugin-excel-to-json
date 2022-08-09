"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTs = void 0;
/*
 * @Author: dgflash
 * @Date: 2022-07-26 18:21:52
 * @LastEditors: dgflash
 * @LastEditTime: 2022-08-09 11:53:10
 */
const path_1 = __importDefault(require("path"));
const main_1 = require("./main");
const fs = require('fs');
async function createTs(name, fieldType, data, primary) {
    // 主键参数
    var script_init_params = "";
    var script_init_data = "";
    var script_init_var = "";
    var script_init_value = "";
    primary.forEach(key => {
        script_init_params += `${key}: number, `;
        script_init_data += `[${key}]`;
        script_init_var += `${key}: number = 0;\r    `;
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
    get ${id}(): ${fieldType[id]} {
        return this.data.${id};
    }`;
        }
    }
    var script = `
import { JsonUtil } from "../../../../../extensions/oops-plugin-framework/assets/core/utils/JsonUtil";

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
    var p = path_1.default.join(__dirname, main_1.config.PathTs);
    console.log(p);
    await fs.writeFileSync(`${p}Table${name}.ts`, script);
}
exports.createTs = createTs;
