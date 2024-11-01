import path from 'path';

import { projectRootPath, readFile, writeFile } from "./utils.js";

export function updateVersionInConfigContent(content, version) {
  const regex = /(version:\s*)\"[^\"]+\"/;

  if (!regex.test(content)) {
    throw new Error('Could not find version field in the config file');
  }
  
  return content.replace(regex, "$1\"" + version + "\"");
}

export async function updateVersionInConfig(host, version) {
  const configPath = host === 'adblock'
    ? 'host/adblock/build/config/base.mjs'
    : 'host/adblockplus/build/webext/config/base.mjs';

  const fullPath = path.join(projectRootPath(), configPath);
  const content = await readFile(fullPath);
  const updatedContent = updateVersionInConfigContent(content, version);
  await writeFile(fullPath, updatedContent);
}
