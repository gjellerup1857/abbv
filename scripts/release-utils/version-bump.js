import path from 'path';

import { projectRootPath, readFile, writeFile } from "./utils.js";

export function updateVersionInConfigContent(content, version) {
  const lines = content.split('\n');
  
  const versionLineIndex = lines.findIndex(line => line.trim().startsWith('version:'));
  if (versionLineIndex === -1) {
    throw new Error('Could not find version field in the config file');
  }
  
  const originalLine = lines[versionLineIndex];
  const indentation = originalLine.slice(0, originalLine.length - originalLine.trimLeft().length);
  lines[versionLineIndex] = `${indentation}version: "${version}",`;
  
  return lines.join('\n');
}

export async function updateVersionInConfig(configPath, version) {
  const fullPath = path.join(projectRootPath(), configPath);
  const content = await readFile(fullPath);
  const updatedContent = updateVersionInConfigContent(content, version);
  await writeFile(fullPath, updatedContent);
}