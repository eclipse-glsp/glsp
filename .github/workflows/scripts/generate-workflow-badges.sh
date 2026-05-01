#!/bin/bash
set -e

ORG="eclipse-glsp"
OUTPUT_FILE="${1:-WORKFLOW_STATUS.md}"
BADGES_PER_LINE=5

echo "Fetching repositories from $ORG organization..."
repos=$(gh api --paginate "orgs/$ORG/repos" --jq '.[].name' | sort)

{
    echo "# Eclipse GLSP Workflow Status"
    echo ""
    echo "> Badges are live — workflow list auto-generated on $(date -u '+%Y-%m-%d')."
    echo "> [Regenerate](https://github.com/$ORG/glsp/actions/workflows/workflow-badges.yml)"
    echo ""

    for repo in $repos; do
        echo "Processing repository: $repo" >&2

        default_branch=$(gh api "repos/$ORG/$repo" --jq '.default_branch')

        workflows=$(gh api "repos/$ORG/$repo/actions/workflows" \
            --jq '[.workflows[] | select(.state == "active" and .name != "Dependabot Updates" and .name != "pages-build-deployment") | {name: .name, path: .path}]')

        workflow_count=$(echo "$workflows" | jq 'length')
        if [ "$workflow_count" -eq 0 ]; then
            echo "  No active workflows, skipping" >&2
            continue
        fi

        echo "## [$repo](https://github.com/$ORG/$repo)"
        echo ""

        badge_count=0
        total_badges=$(echo "$workflows" | jq 'length')
        while IFS= read -r workflow; do
            name=$(echo "$workflow" | jq -r '.name')
            path=$(echo "$workflow" | jq -r '.path')
            filename=$(basename "$path")

            badge_url="https://github.com/$ORG/$repo/actions/workflows/$filename/badge.svg?branch=$default_branch"
            link_url="https://github.com/$ORG/$repo/actions/workflows/$filename"

            printf "[![%s](%s)](%s)" "$name" "$badge_url" "$link_url"
            badge_count=$((badge_count + 1))

            if [ $((badge_count % BADGES_PER_LINE)) -eq 0 ] && [ "$badge_count" -lt "$total_badges" ]; then
                printf "\n"
            elif [ "$badge_count" -lt "$total_badges" ]; then
                printf " "
            fi
        done < <(echo "$workflows" | jq -c '.[]')

        echo ""
        echo ""
    done
} > "$OUTPUT_FILE"

echo "Generated $OUTPUT_FILE"
