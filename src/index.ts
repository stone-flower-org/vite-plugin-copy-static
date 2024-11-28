import fs from 'fs';
import path from 'path';

import mimeTypes from 'mime-types';
import { ResolvedConfig, Plugin, Connect } from 'vite';

export interface CopyStaticTarget {
  from: string;
  to: string;
  filter?: (file: string) => boolean;
}

export interface CopyStaticOptions {
  publicDir: string;
  targets: CopyStaticTarget[];
}

type CopyStaticMap = Map<string, string>;

export const DEFAULT_COPY_STATIC_OPTIONS = {
  publicDir: 'build',
  targets: [],
};

// Common
function mergeMaps(maps: CopyStaticMap[]) {
  const mergedMap: CopyStaticMap = new Map();
  maps.forEach((map) => [...map.entries()].forEach(([key, val]) => mergedMap.set(key, val)));
  return mergedMap;
}

async function getFilesFromPath(source: string, files: string[] = []) {
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
}

function buildCopiesMapFromPaths(files: string[], srcPath: string, destPath: string) {
  const copiesMap: CopyStaticMap = new Map();
  files.forEach((file) => {
    copiesMap.set(file.replace(srcPath, destPath), file);
  });
  return copiesMap;
}

async function buildCopiesMapFromTarget(_: ResolvedConfig, target: CopyStaticTarget) {
  const { from, to, filter } = target;

  const files = await getFilesFromPath(from);
  const filteredFiles = filter ? files.filter(filter) : files;

  return buildCopiesMapFromPaths(filteredFiles, from, to);
}

async function buildCopiesMap(config: ResolvedConfig, options: CopyStaticOptions) {
  const { targets } = options;
  const maps = await Promise.all(targets.map((target) => buildCopiesMapFromTarget(config, target)));
  return mergeMaps(maps);
}

// Serve
function createStaticProxyMiddlewareFromLinksMap(publicLinksMap: CopyStaticMap) {
  return (async (req, res, next) => {
    const pathName = req.url?.split('?')?.[0] ?? '';
    const filePath = publicLinksMap.get(pathName);

    if (req.method !== 'GET' || !filePath) {
      next();
      return;
    }

    try {
      res.writeHead(200, {
        'Content-Type': mimeTypes.lookup(filePath) || 'plain/text',
      });
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    } catch (e) {
      next(e);
    }
  }) satisfies Connect.NextHandleFunction;
}

function buildPublicLinksFromCopiesMap(_: ResolvedConfig, options: CopyStaticOptions, copiesMap: CopyStaticMap) {
  const { publicDir } = options;
  const publicPath = publicDir;

  const aliasesMap: CopyStaticMap = new Map();
  copiesMap.forEach((from, to) => {
    if (to.search(publicPath) !== 0) return;
    aliasesMap.set(to.replace(publicPath, ''), from);
  });

  return aliasesMap;
}

// Build
async function copyFromCopiesMap(copiesMap: CopyStaticMap) {
  await Promise.all(
    [...copiesMap.entries()].map(async ([dest, src]) => {
      await fs.promises.cp(src, dest, { recursive: true });
    }),
  );
}

export default (options: Partial<CopyStaticOptions> = {}) => {
  let config: ResolvedConfig;
  const pluginOptions = Object.assign(DEFAULT_COPY_STATIC_OPTIONS, options);
  return [
    {
      name: 'copy-static:build',
      apply: 'build',
      configResolved(_config) {
        config = _config;
      },
      async writeBundle() {
        const copiesMap = await buildCopiesMap(config, pluginOptions);
        await copyFromCopiesMap(copiesMap);
      },
    } satisfies Plugin,
    {
      name: 'copy-static:serve',
      apply: 'serve',
      configResolved(_config) {
        config = _config;
      },
      async configureServer({ middlewares }) {
        const copiesMap = await buildCopiesMap(config, pluginOptions);
        const publicLinksMap = buildPublicLinksFromCopiesMap(config, pluginOptions, copiesMap);
        middlewares.use(createStaticProxyMiddlewareFromLinksMap(publicLinksMap));
      },
    } satisfies Plugin,
  ];
};
