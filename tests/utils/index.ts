import fs from 'fs';
import { AddressInfo } from 'net';
import path from 'path';

import { ViteDevServer } from 'vite';
import { TaskContext } from 'vitest';

export const TESTS_DIR = path.resolve(__dirname, '../');

export const TMP_DIR = path.resolve(TESTS_DIR, '.tmp');

export const FIXTURES_DIR = path.resolve(TESTS_DIR, 'fixtures');

export const resolveTmpDir = (caseName: string) => path.join(TMP_DIR, caseName);

export const resolveFixturesDir = (p: string) => path.join(FIXTURES_DIR, p);

export const setupTmpDir = async (ctx: TaskContext) => {
  const caseDir = resolveTmpDir(ctx.task.id);
  await fs.promises.mkdir(caseDir, { recursive: true });
  return caseDir;
};

export const clearTmpDirs = () =>
  fs.promises.rm(TMP_DIR, {
    force: true,
    recursive: true,
  });

export const getFilesFromPath = async (source: string, files: string[] = []) => {
  const sourceStats = await fs.promises.stat(source);

  if (!sourceStats.isDirectory()) {
    files.push(source);
    return files;
  }

  const dirResources = await fs.promises.readdir(source);

  await Promise.all(
    dirResources.map(async (resource) => {
      const resourcePath = path.join(source, resource);
      await getFilesFromPath(resourcePath, files);
    }),
  );

  return files;
};

export const fetchFileFromServer = (server: ViteDevServer, path: string) => {
  const port = (server.httpServer!.address() as AddressInfo).port;
  const url = `http://localhost:${port}${path}`;
  return fetch(url);
};

export const fetchFilesContentFromServer = async (server: ViteDevServer, files: string[]) =>
  Promise.all(files.map((file) => fetchFileFromServer(server, file).then((res) => res.text())));

export const fetchFilesContentFromDisk = (files: string[]) =>
  Promise.all(files.map((file) => fs.promises.readFile(file, 'utf-8')));
