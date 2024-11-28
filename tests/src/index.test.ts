import path from 'path';

import { build, createServer, defineConfig, ViteDevServer } from 'vite';

import copyStatic from '@/src/index';

import {
  clearTmpDirs,
  fetchFileFromServer,
  fetchFilesContentFromDisk,
  fetchFilesContentFromServer,
  getFilesFromPath,
  resolveFixturesDir,
  setupTmpDir,
} from '@/tests/utils';

const srcDir = resolveFixturesDir('common/dir');

let server: ViteDevServer | undefined;

afterAll(async () => {
  await clearTmpDirs();
});

afterEach(() => {
  server?.close();
});

describe('copy-static:build', () => {
  it('should copy provided directories', async (ctx) => {
    const caseDir = await setupTmpDir(ctx);

    await build(
      defineConfig({
        logLevel: 'error',
        plugins: [
          copyStatic({
            targets: [
              {
                from: srcDir,
                to: caseDir,
              },
            ],
          }),
        ],
      }),
    );

    expect(await getFilesFromPath(caseDir)).toEqual([
      path.join(caseDir, 'json-0.json'),
      path.join(caseDir, 'plain-0.txt'),
      path.join(caseDir, 'subdir', 'json-1.json'),
      path.join(caseDir, 'subdir', 'plain-1.txt'),
    ]);
  });

  it('should filter copying files using provided filter', async (ctx) => {
    const caseDir = await setupTmpDir(ctx);

    await build(
      defineConfig({
        logLevel: 'error',
        plugins: [
          copyStatic({
            targets: [
              {
                from: srcDir,
                to: caseDir,
                filter: (file: string) => file.endsWith('.txt'),
              },
            ],
          }),
        ],
      }),
    );

    expect(await getFilesFromPath(caseDir)).toEqual([
      path.join(caseDir, 'plain-0.txt'),
      path.join(caseDir, 'subdir', 'plain-1.txt'),
    ]);
  });

  it('should copy specified files', async (ctx) => {
    const caseDir = await setupTmpDir(ctx);

    await build(
      defineConfig({
        logLevel: 'error',
        plugins: [
          copyStatic({
            targets: [
              {
                from: path.join(srcDir, 'subdir', 'json-1.json'),
                to: path.join(caseDir, 'json.json'),
              },
              {
                from: path.join(srcDir, 'plain-0.txt'),
                to: path.join(caseDir, 'plain.txt'),
              },
            ],
          }),
        ],
      }),
    );

    expect(await getFilesFromPath(caseDir)).toEqual([path.join(caseDir, 'json.json'), path.join(caseDir, 'plain.txt')]);
  });

  it('should throw error when invalid source provided', async (ctx) => {
    const caseDir = await setupTmpDir(ctx);

    await expect(async () => {
      await build(
        defineConfig({
          logLevel: 'error',
          plugins: [
            copyStatic({
              targets: [
                {
                  from: '',
                  to: caseDir,
                },
              ],
            }),
          ],
        }),
      );
    }).rejects.toThrow("[copy-static:build] ENOENT: no such file or directory, stat '");
  });
});

describe('copy-static:serve', () => {
  it('should copy provided directories', async (ctx) => {
    const caseDir = await setupTmpDir(ctx);
    server = await createServer(
      defineConfig({
        logLevel: 'error',
        plugins: [
          copyStatic({
            publicDir: caseDir,
            targets: [
              {
                from: srcDir,
                to: caseDir,
              },
            ],
          }),
        ],
        publicDir: caseDir,
      }),
    );
    await server.listen();

    const serverFiles = await fetchFilesContentFromServer(server, [
      '/json-0.json',
      '/plain-0.txt',
      '/subdir/json-1.json',
      '/subdir/plain-1.txt',
    ]);
    const diskFiles = await fetchFilesContentFromDisk([
      path.join(srcDir, 'json-0.json'),
      path.join(srcDir, 'plain-0.txt'),
      path.join(srcDir, 'subdir', 'json-1.json'),
      path.join(srcDir, 'subdir', 'plain-1.txt'),
    ]);

    expect(serverFiles).toEqual(diskFiles);
  });

  it('should filter copying files using provided filter', async (ctx) => {
    const caseDir = await setupTmpDir(ctx);
    server = await createServer(
      defineConfig({
        logLevel: 'error',
        plugins: [
          copyStatic({
            publicDir: caseDir,
            targets: [
              {
                from: srcDir,
                to: caseDir,
                filter: (file: string) => file.endsWith('.txt'),
              },
            ],
          }),
        ],
        publicDir: caseDir,
      }),
    );
    await server.listen();

    const serverFiles = await fetchFilesContentFromServer(server, ['/plain-0.txt', '/subdir/plain-1.txt']);
    const diskFiles = await fetchFilesContentFromDisk([
      path.join(srcDir, 'plain-0.txt'),
      path.join(srcDir, 'subdir', 'plain-1.txt'),
    ]);
    expect(serverFiles).toEqual(diskFiles);
    expect((await fetchFileFromServer(server, '/json-0.json')).status).toBe(404);
    expect((await fetchFileFromServer(server, '/subdir/json-1.json')).status).toBe(404);
  });

  it('should copy specified files', async (ctx) => {
    const caseDir = await setupTmpDir(ctx);
    server = await createServer(
      defineConfig({
        logLevel: 'error',
        plugins: [
          copyStatic({
            publicDir: caseDir,
            targets: [
              {
                from: path.join(srcDir, 'subdir', 'json-1.json'),
                to: path.join(caseDir, 'json.json'),
              },
              {
                from: path.join(srcDir, 'plain-0.txt'),
                to: path.join(caseDir, 'plain.txt'),
              },
            ],
          }),
        ],
        publicDir: caseDir,
      }),
    );
    await server.listen();

    const serverFiles = await fetchFilesContentFromServer(server, ['/plain.txt', '/json.json']);
    const diskFiles = await fetchFilesContentFromDisk([
      path.join(srcDir, 'plain-0.txt'),
      path.join(srcDir, 'subdir', 'json-1.json'),
    ]);
    expect(serverFiles).toEqual(diskFiles);
  });

  it('should throw error when invalid source provided', async (ctx) => {
    const caseDir = await setupTmpDir(ctx);

    await expect(async () => {
      await createServer(
        defineConfig({
          logLevel: 'error',
          plugins: [
            copyStatic({
              targets: [
                {
                  from: '',
                  to: caseDir,
                },
              ],
            }),
          ],
        }),
      );
    }).rejects.toThrow("ENOENT: no such file or directory, stat '");
  });
});
