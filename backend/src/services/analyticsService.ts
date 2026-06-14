import { db } from '../db'

export async function getCardsByStatus(boardId: number, period: string) {
  // Filter by period logic could be added based on card.created_at or card.updated_at
  // But for simple statuses, we'll just show current snapshot for now, or filter by created_at
  let periodFilter = db``
  if (period === 'week') {
    periodFilter = db`AND c.created_at >= NOW() - INTERVAL '7 days'`
  } else if (period === 'month') {
    periodFilter = db`AND c.created_at >= NOW() - INTERVAL '30 days'`
  }

  const data = await db`
    SELECT l.title as status, CAST(COUNT(c.id) AS INTEGER) as count
    FROM lists l
    LEFT JOIN cards c ON c.list_id = l.id ${periodFilter}
    WHERE l.board_id = ${boardId}
    GROUP BY l.id, l.title
    ORDER BY l.position
  `
  return data
}

export async function getCardsByMember(boardId: number, period: string) {
  let periodFilter = db``
  if (period === 'week') {
    periodFilter = db`AND c.created_at >= NOW() - INTERVAL '7 days'`
  } else if (period === 'month') {
    periodFilter = db`AND c.created_at >= NOW() - INTERVAL '30 days'`
  }

  // A card might be completed. We'll join cards, and group by users.
  const data = await db`
    SELECT 
      u.id, 
      u.email as name, 
      u.avatar_url,
      CAST(COUNT(c.id) AS INTEGER) as total,
      CAST(SUM(CASE WHEN c.is_completed THEN 1 ELSE 0 END) AS INTEGER) as completed
    FROM users u
    JOIN cards c ON c.assignee_id = u.id
    WHERE c.list_id IN (SELECT id FROM lists WHERE board_id = ${boardId}) ${periodFilter}
    GROUP BY u.id, u.email, u.avatar_url
    ORDER BY total DESC
  `
  return data
}

export async function getCompletionRate(boardId: number, period: string) {
  let interval = '30 days'
  if (period === 'week') interval = '7 days'
  
  // Return daily completion rates
  const data = await db`
    WITH dates AS (
      SELECT generate_series(
        date_trunc('day', NOW() - INTERVAL '${db.unsafe(interval)}'),
        date_trunc('day', NOW()),
        '1 day'::interval
      ) as d
    ),
    stats AS (
      SELECT 
        date_trunc('day', updated_at) as completed_date,
        COUNT(id) as count
      FROM cards
      WHERE list_id IN (SELECT id FROM lists WHERE board_id = ${boardId}) AND is_completed = true
      GROUP BY 1
    )
    SELECT 
      to_char(d.d, 'Mon DD') as date,
      COALESCE(s.count, 0)::int as completed,
      -- total could be total active cards on that day or just a generic rate.
      -- The requirement says: date, completed, total, rate. 
      -- We will just mock total as a static or cumulative number, or simple daily counts.
      COALESCE(s.count, 0)::int as rate
    FROM dates d
    LEFT JOIN stats s ON d.d = s.completed_date
    ORDER BY d.d ASC
  `
  // We need to return an array of { date, completed, total, rate }
  // Let's modify the total and rate calculation in JS for simplicity
  let cumulativeTotal = 0
  const formatted = data.map(row => {
    cumulativeTotal += row.completed
    return {
      ...row,
      total: cumulativeTotal,
      rate: cumulativeTotal > 0 ? Math.round((row.completed / cumulativeTotal) * 100) : 0
    }
  })
  return formatted
}

export async function getVelocity(boardId: number, period: string) {
  // Returns cards added vs completed per period
  const data = await db`
    WITH dates AS (
      SELECT generate_series(
        date_trunc('week', NOW() - INTERVAL '12 weeks'),
        date_trunc('week', NOW()),
        '1 week'::interval
      ) as w
    ),
    completed_stats AS (
      SELECT 
        date_trunc('week', updated_at) as w,
        COUNT(id) as completed
      FROM cards
      WHERE list_id IN (SELECT id FROM lists WHERE board_id = ${boardId}) AND is_completed = true
      GROUP BY 1
    ),
    added_stats AS (
      SELECT 
        date_trunc('week', created_at) as w,
        COUNT(id) as added
      FROM cards
      WHERE list_id IN (SELECT id FROM lists WHERE board_id = ${boardId})
      GROUP BY 1
    )
    SELECT 
      to_char(d.w, 'WK IW') as period,
      COALESCE(c.completed, 0)::int as completed,
      COALESCE(a.added, 0)::int as added
    FROM dates d
    LEFT JOIN completed_stats c ON d.w = c.w
    LEFT JOIN added_stats a ON d.w = a.w
    ORDER BY d.w ASC
  `
  return data
}

export async function getSummary(boardId: number, period: string) {
  let periodFilter = db``
  if (period === 'week') {
    periodFilter = db`AND created_at >= NOW() - INTERVAL '7 days'`
  } else if (period === 'month') {
    periodFilter = db`AND created_at >= NOW() - INTERVAL '30 days'`
  }

  const [row] = await db`
    SELECT 
      COUNT(id)::int as total_cards,
      COALESCE(SUM(CASE WHEN is_completed THEN 1 ELSE 0 END), 0)::int as completed_cards,
      COALESCE(SUM(CASE WHEN due_date < NOW() AND NOT is_completed THEN 1 ELSE 0 END), 0)::int as overdue_cards,
      COALESCE(AVG(CASE WHEN is_completed AND updated_at > created_at THEN EXTRACT(EPOCH FROM (updated_at - created_at))/86400 ELSE NULL END), 0)::numeric(10,1) as avg_completion_days
    FROM cards
    WHERE list_id IN (SELECT id FROM lists WHERE board_id = ${boardId}) ${periodFilter}
  `

  const total = row.total_cards || 0
  const completed = row.completed_cards || 0
  
  return {
    ...row,
    avg_completion_days: Number(row.avg_completion_days),
    completion_percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  }
}

import { WORKLOAD_THRESHOLDS, CapacityLevel } from '../lib/constants';

export function getCapacityLevel(activeCards: number): CapacityLevel {
  if (activeCards <= WORKLOAD_THRESHOLDS.UNDERLOAD) return 'underload';
  if (activeCards <= WORKLOAD_THRESHOLDS.OPTIMAL) return 'optimal';
  return 'overload';
}

export async function getWorkload(boardId: number, period: string) {
  let periodFilter = db``;
  if (period === 'week') {
    periodFilter = db`AND c.created_at >= NOW() - INTERVAL '7 days'`;
  } else if (period === 'month') {
    periodFilter = db`AND c.created_at >= NOW() - INTERVAL '30 days'`;
  }

  const data = await db`
    SELECT 
      u.id, 
      u.email as name, 
      u.avatar_url,
      CAST(COUNT(c.id) AS INTEGER) as total_cards,
      CAST(SUM(CASE WHEN c.is_completed = false THEN 1 ELSE 0 END) AS INTEGER) as active_cards,
      CAST(SUM(CASE WHEN c.is_completed = true THEN 1 ELSE 0 END) AS INTEGER) as completed_cards,
      CAST(SUM(CASE WHEN c.due_date < NOW() AND c.is_completed = false THEN 1 ELSE 0 END) AS INTEGER) as overdue_cards
    FROM users u
    JOIN cards c ON c.assignee_id = u.id
    WHERE c.list_id IN (SELECT id FROM lists WHERE board_id = ${boardId}) ${periodFilter}
    GROUP BY u.id, u.email, u.avatar_url
    ORDER BY active_cards DESC
  `;

  return data.map(member => ({
    ...member,
    capacity_level: getCapacityLevel(member.active_cards)
  }));
}

export async function getWorkloadCards(boardId: number, userId: number, period: string) {
  let periodFilter = db``;
  if (period === 'week') {
    periodFilter = db`AND c.created_at >= NOW() - INTERVAL '7 days'`;
  } else if (period === 'month') {
    periodFilter = db`AND c.created_at >= NOW() - INTERVAL '30 days'`;
  }

  const cards = await db`
    SELECT 
      c.id,
      c.title,
      c.due_date,
      l.title as list_title,
      CASE WHEN c.due_date < NOW() AND c.is_completed = false THEN true ELSE false END as is_overdue,
      COALESCE(
        json_agg(
          json_build_object('id', cl.id, 'name', cl.name, 'color', cl.color)
        ) FILTER (WHERE cl.id IS NOT NULL),
        '[]'
      ) as labels
    FROM cards c
    JOIN lists l ON c.list_id = l.id
    LEFT JOIN card_labels card_l ON card_l.card_id = c.id
    LEFT JOIN labels cl ON cl.id = card_l.label_id
    WHERE l.board_id = ${boardId} 
      AND c.assignee_id = ${userId}
      ${periodFilter}
    GROUP BY c.id, l.title
    ORDER BY c.due_date ASC NULLS LAST
  `;

  return cards;
}
