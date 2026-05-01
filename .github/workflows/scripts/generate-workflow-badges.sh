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
            --jq '[.workflows[] | select(.state == "active" and .name != "Dependabot Updates" and .name != "pages-build-deployment") | {id: .id, name: .name, path: .path}]')

        workflow_count=$(echo "$workflows" | jq 'length')
        if [ "$workflow_count" -eq 0 ]; then
            echo "  No active workflows, skipping" >&2
            continue
        fi

        # Filter to workflows that have runs on the default branch
        badges=()
        while IFS= read -r workflow; do
            wf_id=$(echo "$workflow" | jq -r '.id')
            name=$(echo "$workflow" | jq -r '.name')
            path=$(echo "$workflow" | jq -r '.path')
            filename=$(basename "$path")

            run_count=$(gh api "repos/$ORG/$repo/actions/workflows/$wf_id/runs?branch=$default_branch&per_page=1" --jq '.total_count')
            if [ "$run_count" -eq 0 ]; then
                echo "  Skipping $name (no runs on $default_branch)" >&2
                continue
            fi

            badge_url="https://github.com/$ORG/$repo/actions/workflows/$filename/badge.svg?branch=$default_branch"
            link_url="https://github.com/$ORG/$repo/actions/workflows/$filename"
            badges+=("[![${name}](${badge_url})](${link_url})")
        done < <(echo "$workflows" | jq -c '.[]')

        total_badges=${#badges[@]}
        if [ "$total_badges" -eq 0 ]; then
            echo "  No workflows with runs on $default_branch, skipping" >&2
            continue
        fi

        echo "## [$repo](https://github.com/$ORG/$repo)"
        echo ""

        for i in "${!badges[@]}"; do
            printf "%s" "${badges[$i]}"
            pos=$((i + 1))
            if [ "$pos" -lt "$total_badges" ]; then
                if [ $((pos % BADGES_PER_LINE)) -eq 0 ]; then
                    printf "\n"
                else
                    printf " "
                fi
            fi
        done
        echo ""
        echo ""
    done
} > "$OUTPUT_FILE"

echo "Generated $OUTPUT_FILE"
