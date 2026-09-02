#!/usr/bin/env node
/**
 * Fail if the installed react-native-nitro-modules version does not match
 * the single version pinned in yarn.lock.
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(path.join(root, 'package.json'))

const installed = require('react-native-nitro-modules/package.json').version
const lock = fs.readFileSync(path.join(root, 'yarn.lock'), 'utf8')
const versions = new Set()
const re = /^"?react-native-nitro-modules@[^"\n]+"?:\n  version: ([^\n]+)/gm
let match
while ((match = re.exec(lock)) !== null) {
  versions.add(match[1].trim())
}

if (versions.size === 0) {
  console.error('assert-nitro-pin: react-native-nitro-modules missing from yarn.lock')
  process.exit(1)
}

if (versions.size !== 1) {
  console.error(
    `assert-nitro-pin: multiple lockfile versions: ${[...versions].join(', ')}`
  )
  process.exit(1)
}

const pinned = [...versions][0]
if (installed !== pinned) {
  console.error(
    `assert-nitro-pin: installed ${installed} != lockfile ${pinned}`
  )
  process.exit(1)
}

console.log(`react-native-nitro-modules ${installed} matches lockfile pin`)
