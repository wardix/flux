import { db } from '../db'
import * as path from 'path'
import * as fs from 'fs'

export async function getBranding(workspaceId: number) {
  const result = await db`
    SELECT * FROM workspace_branding 
    WHERE workspace_id = ${workspaceId}
  `
  return result[0] || null
}

export async function upsertBranding(
  workspaceId: number,
  data: {
    app_name?: string
    primary_color?: string
    secondary_color?: string
    custom_domain?: string | null
    custom_css?: string | null
  }
) {
  // Check if exists
  const existing = await getBranding(workspaceId)

  if (existing) {
    const updated = await db`
      UPDATE workspace_branding
      SET 
        app_name = COALESCE(${data.app_name !== undefined ? data.app_name : null}, app_name),
        primary_color = COALESCE(${data.primary_color !== undefined ? data.primary_color : null}, primary_color),
        secondary_color = COALESCE(${data.secondary_color !== undefined ? data.secondary_color : null}, secondary_color),
        custom_domain = ${data.custom_domain !== undefined ? data.custom_domain : existing.custom_domain},
        custom_css = ${data.custom_css !== undefined ? data.custom_css : existing.custom_css},
        updated_at = NOW()
      WHERE workspace_id = ${workspaceId}
      RETURNING *
    `
    return updated[0]
  } else {
    const inserted = await db`
      INSERT INTO workspace_branding (
        workspace_id,
        app_name,
        primary_color,
        secondary_color,
        custom_domain,
        custom_css
      ) VALUES (
        ${workspaceId},
        ${data.app_name || 'Flux'},
        ${data.primary_color || '#2563EB'},
        ${data.secondary_color || '#7C3AED'},
        ${data.custom_domain || null},
        ${data.custom_css || null}
      )
      RETURNING *
    `
    return inserted[0]
  }
}

export async function updateLogoUrl(workspaceId: number, logoUrl: string | null) {
  const existing = await getBranding(workspaceId)
  if (existing) {
    const updated = await db`
      UPDATE workspace_branding
      SET logo_url = ${logoUrl}, updated_at = NOW()
      WHERE workspace_id = ${workspaceId}
      RETURNING *
    `
    return updated[0]
  } else {
    const inserted = await db`
      INSERT INTO workspace_branding (
        workspace_id,
        app_name,
        logo_url
      ) VALUES (
        ${workspaceId},
        'Flux',
        ${logoUrl}
      )
      RETURNING *
    `
    return inserted[0]
  }
}

export async function updateFaviconUrl(workspaceId: number, faviconUrl: string | null) {
  const existing = await getBranding(workspaceId)
  if (existing) {
    const updated = await db`
      UPDATE workspace_branding
      SET favicon_url = ${faviconUrl}, updated_at = NOW()
      WHERE workspace_id = ${workspaceId}
      RETURNING *
    `
    return updated[0]
  } else {
    const inserted = await db`
      INSERT INTO workspace_branding (
        workspace_id,
        app_name,
        favicon_url
      ) VALUES (
        ${workspaceId},
        'Flux',
        ${faviconUrl}
      )
      RETURNING *
    `
    return inserted[0]
  }
}

export async function deleteBranding(workspaceId: number) {
  await db`
    DELETE FROM workspace_branding
    WHERE workspace_id = ${workspaceId}
  `
}

export function validateColorHex(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color)
}

export async function isAdmin(userId: number, workspaceId: number): Promise<boolean> {
  const result = await db`
    SELECT role FROM workspace_members
    WHERE user_id = ${userId} AND workspace_id = ${workspaceId}
  `
  if (result.length === 0) return false
  const role = result[0].role
  return role === 'owner' || role === 'admin'
}
