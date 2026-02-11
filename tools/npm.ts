#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { parse } from 'jsr:@std/jsonc@1'

interface DenoConfig {
  imports?: Record<string, string>
  version?: string
}

interface PackageJson {
  name?: string
  version?: string
  dependencies?: Record<string, string>
}

/**
 * Parse npm specifier from deno.json import
 * Examples:
 *   npm:lit@^3.3.2 -> { name: "lit", version: "^3.3.2" }
 *   npm:@awesome.me/webawesome@^3.1.0 -> { name: "@awesome.me/webawesome", version: "^3.1.0" }
 */
function parseNpmSpecifier(specifier: string): { name: string; version: string } | null {
  if (!specifier.startsWith('npm:')) {
    return null
  }

  const npmPart = specifier.slice(4) // Remove 'npm:' prefix
  const lastAtIndex = npmPart.lastIndexOf('@')

  if (lastAtIndex === -1) {
    // No version specified
    return { name: npmPart, version: 'latest' }
  }

  // Handle scoped packages (e.g., @awesome.me/package@version)
  if (npmPart.startsWith('@')) {
    if (lastAtIndex === 0) {
      // Only the scope '@', no version
      return { name: npmPart, version: 'latest' }
    }
  }

  const name = npmPart.slice(0, lastAtIndex)
  const version = npmPart.slice(lastAtIndex + 1)

  return { name, version }
}

/**
 * Extract npm dependencies from deno.json imports
 */
function extractNpmDependencies(denoConfig: DenoConfig): Record<string, string> {
  const dependencies: Record<string, string> = {}

  if (!denoConfig.imports) {
    return dependencies
  }

  for (const [_alias, specifier] of Object.entries(denoConfig.imports)) {
    const parsed = parseNpmSpecifier(specifier)
    if (parsed) {
      dependencies[parsed.name] = parsed.version
    }
  }

  return dependencies
}

/**
 * Generate minimal package.json from deno.json
 */
async function generatePackageJson() {
  try {
    // Read deno.json
    const denoJsonPath = './deno.json'
    const denoJsonText = await Deno.readTextFile(denoJsonPath)
    const denoConfig = parse(denoJsonText) as DenoConfig

    // Read existing package.json if it exists
    let existingPackageJson: PackageJson = {}
    try {
      const packageJsonText = await Deno.readTextFile('./package.json')
      existingPackageJson = JSON.parse(packageJsonText)
    } catch {
      // package.json doesn't exist, will create new one
    }

    // Extract npm dependencies
    const dependencies = extractNpmDependencies(denoConfig)

    // Create minimal package.json
    const packageJson: PackageJson = {
      name: existingPackageJson.name || 'theme-webawesome',
      version: denoConfig.version || existingPackageJson.version || '0.0.0',
      dependencies: Object.keys(dependencies).length > 0 ? dependencies : undefined,
    }

    // Write package.json
    const packageJsonPath = './package.json'
    await Deno.writeTextFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + '\n',
    )

    console.log('✅ Generated package.json with npm dependencies from deno.json')
    console.log(`📦 Found ${Object.keys(dependencies).length} npm dependencies`)

    if (Object.keys(dependencies).length > 0) {
      console.log('\nDependencies:')
      for (const [name, version] of Object.entries(dependencies)) {
        console.log(`  ${name}@${version}`)
      }
    }
  } catch (error:Error|unknown) {
    console.error('❌ Error generating package.json:', error instanceof Error ? error.message : String(error))
    Deno.exit(1)
  }
}

// Run the utility
if (import.meta.main) {
  await generatePackageJson()
}
