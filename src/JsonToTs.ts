/*
 * @Author: dgflash
 * @Date: 2022-07-26 18:21:52
 * @LastEditors: dgflash
 * @LastEditTime: 2022-09-19 16:20:35
 */
import path from "path";
import { config } from "./main";

const fs = require('fs')

export async function createTsClient(name: string, fieldType: any, data: any, primary: string[]) {
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
        script_init_value += `this.${key} = ${key};\r        `
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

    var p = path.join(__dirname, config.PathTsClient);
    await fs.writeFileSync(`${p}Table${name}.ts`, script);
}

export async function createTsServer(name: string, fieldType: any, data: any, primary: string[]) {
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
        script_init_value += `this.${key} = ${key};\r        `
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
    static TableName: string = "/config/${name}.json";
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

    var p = path.join(__dirname, config.PathTsServer);
    await fs.writeFileSync(`${p}Table${name}.ts`, script);
}

