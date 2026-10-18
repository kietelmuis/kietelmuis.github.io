#!/usr/bin/env bash
# Regenerate activity.json, the contribution snapshot the site renders.
#
# The contribution calendar is only reachable through GraphQL, which rejects
# unauthenticated queries, so this needs a token. It is read from the
# environment and never written to the repo — do not inline it here.
#
#   GITHUB_TOKEN=ghp_xxx ./scripts/refresh-activity.sh
#
# A classic token with `read:user` is the minimal scope that works. The calendar
# is public data but the field is user-scoped, so an unauthenticated query is
# rejected outright; nothing wider is needed and no repository access at all is
# involved.
set -euo pipefail

LOGIN="${GITHUB_LOGIN:-kietelmuis}"
OUT="${1:-activity.json}"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "GITHUB_TOKEN is not set." >&2
  echo "Create one at https://github.com/settings/tokens and run:" >&2
  echo "  GITHUB_TOKEN=ghp_xxx $0" >&2
  exit 1
fi

command -v jq >/dev/null 2>&1 || { echo "jq is required." >&2; exit 1; }

# contributionsCollection spans at most one year, so anchor it to the calendar
# year rather than the last 365 days: a full Jan-Dec reads correctly against a
# month axis, and it refreshes predictably once a year instead of nightly.
YEAR="${YEAR:-$(date +%Y)}"
FROM="$YEAR-01-01T00:00:00Z"
TO="$YEAR-12-31T23:59:59Z"

echo "Fetching $LOGIN for $YEAR..."

RESPONSE=$(curl -sS https://api.github.com/graphql \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg login "$LOGIN" --arg from "$FROM" --arg to "$TO" '{
    query: "query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}",
    variables: { login: $login, from: $from, to: $to }
  }')")

# A GraphQL error arrives in the body with HTTP 200, so check for it explicitly
# rather than trusting the exit status.
# Reject anything that is not actually a calendar. Three failure modes have to be
# caught here and only the last is obvious:
#   - GraphQL errors, which arrive in the body alongside HTTP 200
#   - HTTP 403/401, which carries {message, documentation_url} and not {errors},
#     and which curl -sS reports as success
#   - an authenticated response for the wrong shape entirely
# Checking that the total is present catches all three; trusting the HTTP status
# or the error key alone catches one.
CALENDAR='.data.user.contributionsCollection.contributionCalendar'

ERROR=$(echo "$RESPONSE" | jq -r "(.errors // empty | .[0].message // empty) // .message // empty")
if [ -n "$ERROR" ]; then
  echo "GitHub API error: $ERROR" >&2
  exit 1
fi

if [ "$(echo "$RESPONSE" | jq -r "$CALENDAR.totalContributions // empty")" = "" ]; then
  echo "Unexpected response shape — no contributionCalendar. Not overwriting $OUT." >&2
  echo "$RESPONSE" | jq . >&2
  exit 1
fi

# login and year arrive as arguments rather than being interpolated into the
# program. Interpolating only looked like it worked because $YEAR is a bare
# number: the shell turned `'"$LOGIN"'` into `login: kietelmuis`, which jq reads
# as a call to a filter named kietelmuis and refuses to compile. --arg takes any
# string, and --argjson keeps year a number as the placeholder file has it.
#
# Written to a temp file and moved into place. The shell creates a redirect's
# target before the command runs, so a jq that fails leaves an empty $OUT behind
# for anything that checks only that the file exists.
TMP="$OUT.tmp.$$"
trap 'rm -f "$TMP"' EXIT

echo "$RESPONSE" | jq --arg login "$LOGIN" --argjson year "$YEAR" '{
  login: $login,
  year: $year,
  total: .data.user.contributionsCollection.contributionCalendar.totalContributions,
  days: [ .data.user.contributionsCollection.contributionCalendar.weeks[].contributionDays[]
         | { date, count: .contributionCount } ]
}' > "$TMP"

mv "$TMP" "$OUT"

DAYS=$(jq '.days | length' "$OUT")
TOTAL=$(jq '.total' "$OUT")
echo "Wrote $OUT — $DAYS days, $TOTAL contributions."