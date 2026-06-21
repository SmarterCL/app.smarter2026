#!/usr/bin/env bash
set -euo pipefail

REQUIRED=( \
  NEXT_PUBLIC_SUPABASE_URL \
  NEXT_PUBLIC_SUPABASE_ANON_KEY \
  SUPABASE_SERVICE_ROLE_KEY \
  FASTAPI_URL \
)

OPTIONAL=( \
  NEXT_PUBLIC_DEMO_MODE \
  SMTP_HOST \
  SMTP_PORT \
  SMTP_USER \
  SMTP_PASS \
  EMAIL_FROM \
  BILLIONMAIL_SMTP_HOST \
  BILLIONMAIL_SMTP_PORT \
  BILLIONMAIL_SMTP_USER \
  BILLIONMAIL_SMTP_PASS \
  BILLIONMAIL_SMTP_FROM \
)

missing=()
short=()
for v in "${REQUIRED[@]}"; do
  val="${!v-}" || true
  if [ -z "${val}" ]; then
    missing+=("$v")
  elif [ "${#val}" -lt 12 ]; then
    short+=("$v")
  fi
done

json='{'
json+="\"required\":{"
first=1
for v in "${REQUIRED[@]}"; do
  [ $first -eq 0 ] && json+=',' || first=0
  val="${!v-}"
  [ -n "$val" ] && json+="\"$v\":\"present\"" || json+="\"$v\":\"missing\""
done
json+='},'
json+="\"optional\":{"
first=1
for v in "${OPTIONAL[@]}"; do
  [ $first -eq 0 ] && json+=',' || first=0
  val="${!v-}"
  [ -n "$val" ] && json+="\"$v\":\"present\"" || json+="\"$v\":\"missing\""
done
json+='},'
json+="\"missing\":["
first=1
for v in "${missing[@]}"; do
  [ $first -eq 0 ] && json+=',' || first=0
  json+="\"$v\""
done
json+='],"short":["
first=1
for v in "${short[@]}"; do
  [ $first -eq 0 ] && json+=',' || first=0
  json+="\"$v\""
done
json+=']}'

echo "$json"

echo "Tip: For production, set ONLY the required + optional you actually use." >&2
