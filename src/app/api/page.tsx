import { exec, ExecException } from "child_process";

export default function handler() {
    const directoryPath = "c:\\users\\siva_\\workspace\\code\\"

    console.log("handler to execute code command entered")

    exec(`code ${directoryPath}`)
}