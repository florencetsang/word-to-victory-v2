#!/usr/bin/env node
// Writes your production values into the native projects and the .well-known files.
// Run it again whenever a value changes. Only the values you pass are updated.
//
//   node scripts/configure-mobile.mjs \
//     --site https://wordtovictory.app \
//     --apple-team-id ABCDE12345 \
//     --google-ios-client-id 1234-abc.apps.googleusercontent.com \
//     --android-sha256 AA:BB:...:FF
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const BUNDLE_ID = 'com.wordtovictory.app'

const { values } = parseArgs({
  options: {
    site: { type: 'string' },
    'apple-team-id': { type: 'string' },
    'google-ios-client-id': { type: 'string' },
    'android-sha256': { type: 'string', multiple: true },
  },
})

function patch(path, pattern, replacement) {
  const before = readFileSync(path, 'utf8')
  if (!pattern.test(before)) throw new Error(`Pattern ${pattern} not found in ${path}`)
  writeFileSync(path, before.replace(pattern, replacement))
  console.log(`updated ${path}`)
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
  execFileSync('npx', ['prettier', '--parser', 'json', '--write', path])
  console.log(`updated ${path}`)
}

if (values.site) {
  const host = new URL(values.site).host
  patch('ios/App/App/App.entitlements', /applinks:[^<]*/, `applinks:${host}`)
  patch('android/app/src/main/AndroidManifest.xml', /(android:scheme="https" android:host=")[^"]*"/, `$1${host}"`)
}

if (values['apple-team-id']) {
  const teamId = values['apple-team-id'].trim()
  if (!/^[A-Z0-9]{10}$/.test(teamId)) throw new Error('The Apple Team ID is 10 uppercase letters or digits.')
  writeJson('public/.well-known/apple-app-site-association', {
    applinks: {
      details: [{ appIDs: [`${teamId}.${BUNDLE_ID}`], components: [{ '/': '/join/*' }, { '/': '/s/*' }] }],
    },
  })
}

if (values['google-ios-client-id']) {
  const id = values['google-ios-client-id'].trim()
  const suffix = '.apps.googleusercontent.com'
  if (!id.endsWith(suffix)) throw new Error(`The iOS client ID should end with ${suffix}`)
  const reversed = `com.googleusercontent.apps.${id.slice(0, -suffix.length)}`
  patch('ios/App/App/Info.plist', /com\.googleusercontent\.apps\.[^<]*/, reversed)
}

if (values['android-sha256']) {
  const prints = values['android-sha256'].map((s) => s.trim().toUpperCase())
  for (const p of prints) {
    if (!/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(p)) throw new Error(`Not a SHA-256 fingerprint: ${p}`)
  }
  writeJson('public/.well-known/assetlinks.json', [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: { namespace: 'android_app', package_name: BUNDLE_ID, sha256_cert_fingerprints: prints },
    },
  ])
}

if (!Object.values(values).some(Boolean)) {
  console.log('Nothing to do. Pass --site, --apple-team-id, --google-ios-client-id or --android-sha256.')
}
