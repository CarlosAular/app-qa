#!/usr/bin/env node
import {spawnSync} from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const supportedExtensions = new Set([
  ".cjs",
  ".css",
  ".js",
  ".jsx",
  ".json",
  ".jsonc",
  ".md",
  ".mdx",
  ".mjs",
  ".ts",
  ".tsx",
])

const filePathKeys = new Set([
  "file_path",
  "filePath",
  "path",
  "target_file",
  "targetFile",
])

const root = process.cwd()

const readStdin = async () => {
  let input = ""

  process.stdin.setEncoding("utf8")

  for await (const chunk of process.stdin) {
    input += chunk
  }

  return input.trim()
}

const parseJson = input => {
  if (!input) {
    return null
  }

  try {
    return JSON.parse(input)
  } catch (_error) {
    return null
  }
}

const isInsideRoot = filePath => {
  const relative = path.relative(root, filePath)

  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  )
}

const normalizeFilePath = filePath => {
  if (typeof filePath !== "string" || filePath.length === 0) {
    return null
  }

  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(root, filePath)

  if (!isInsideRoot(absolutePath)) {
    return null
  }

  return absolutePath
}

const collectFilePaths = (value, paths = new Set()) => {
  if (!value || typeof value !== "object") {
    return paths
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectFilePaths(item, paths)
    }

    return paths
  }

  for (const [key, child] of Object.entries(value)) {
    if (filePathKeys.has(key)) {
      const normalized = normalizeFilePath(child)

      if (normalized) {
        paths.add(normalized)
      }

      continue
    }

    collectFilePaths(child, paths)
  }

  return paths
}

const getGitDiffFiles = () => {
  const result = spawnSync(
    "git",
    ["diff", "--name-only", "--diff-filter=ACMRTUXB"],
    {
      cwd: root,
      encoding: "utf8",
    }
  )

  if (result.status !== 0) {
    return []
  }

  return result.stdout
    .split("\n")
    .map(filePath => normalizeFilePath(filePath.trim()))
    .filter(Boolean)
}

const toSupportedExistingFiles = filePaths => {
  return [...filePaths]
    .filter(filePath => fs.existsSync(filePath))
    .filter(filePath => fs.statSync(filePath).isFile())
    .filter(filePath => supportedExtensions.has(path.extname(filePath)))
}

const getPrettierCommand = () => {
  if (process.env.PRETTIER_BIN) {
    return {
      command: process.env.PRETTIER_BIN,
      args: [],
    }
  }

  const localPrettier = path.join(root, "node_modules", ".bin", "prettier")

  if (fs.existsSync(localPrettier)) {
    return {
      command: localPrettier,
      args: [],
    }
  }

  return {
    command: "bunx",
    args: ["prettier"],
  }
}

const main = async () => {
  const input = await readStdin()
  const payload = parseJson(input)
  const filesFromPayload = payload ? collectFilePaths(payload) : new Set()
  const shouldUseGitDiff =
    filesFromPayload.size === 0 &&
    (Boolean(payload) || process.env.FORMAT_AFTER_EDIT_USE_GIT_DIFF === "1")

  const candidateFiles = shouldUseGitDiff
    ? getGitDiffFiles()
    : [...filesFromPayload]
  const files = toSupportedExistingFiles(candidateFiles).map(filePath =>
    path.relative(root, filePath)
  )

  if (files.length === 0) {
    return
  }

  const {command, args} = getPrettierCommand()
  const result = spawnSync(command, [...args, "--write", ...files], {
    cwd: root,
    stdio: "inherit",
  })

  if (result.error) {
    throw result.error
  }

  process.exitCode = result.status === null ? 1 : result.status
}

main().catch(error => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`
  )
  process.exitCode = 1
})
