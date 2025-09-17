#!/bin/bash
set -e

# Initialize counters
total_repos=0
total_workflows=0
total_failed=0
total_success=0
failed_jobs=()
repo_details=()
all_workflows=()

echo "# Eclipse GLSP Workflow Status"
echo ""
echo "Overview of all Workflows in the Eclipse GLSP organization running on master or main"
echo ""
echo "Generated on: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

# Get all repositories in eclipse-glsp organization
echo "Fetching repositories from eclipse-glsp organization..."
repos=$(gh api --paginate "orgs/eclipse-glsp/repos" --jq '.[].name' | sort)

# For testing, limit to first few repos if TEST_MODE is set
if [ "$TEST_MODE" = "true" ]; then
  repos=$(echo "$repos" | head -3)
  echo "TEST MODE: Processing only first 3 repositories"
fi

# Process each repository
for repo in $repos; do
  echo "Processing repository: $repo"
  total_repos=$((total_repos + 1))
  
  # Get default branch for this repo
  default_branch=$(gh api "repos/eclipse-glsp/$repo" --jq '.default_branch')
  
  # Override default branch for specific repos
  case "$repo" in
    "glsp-playwright"|"glsp-server-node")
      # These repos might have different default branches, but we'll use the detected one
      ;;
    *)
      # Most repos use master as default
      if [ "$default_branch" != "master" ]; then
        echo "  Note: $repo uses '$default_branch' as default branch (not master)"
      fi
      ;;
  esac
  
  # Get workflows for this repository (exclude Dependabot Updates workflows)
  workflows=$(gh api "repos/eclipse-glsp/$repo/actions/workflows" --jq '.workflows[] | select(.state == "active" and .name != "Dependabot Updates") | {id: .id, name: .name, path: .path}')
  
  if [ -z "$workflows" ]; then
    echo "  No active workflows found in $repo"
    repo_details+=("## $repo|No active workflows found")
    continue
  fi
  
  repo_workflows=()
  repo_workflow_count=0
  
  # Process each workflow
  while IFS= read -r workflow; do
    if [ -z "$workflow" ]; then
      continue
    fi
    
    workflow_id=$(echo "$workflow" | jq -r '.id')
    workflow_name=$(echo "$workflow" | jq -r '.name')
    workflow_path=$(echo "$workflow" | jq -r '.path')
    
    repo_workflow_count=$((repo_workflow_count + 1))
    total_workflows=$((total_workflows + 1))
    
    echo "  Processing workflow: $workflow_name (ID: $workflow_id)"
    
    # Get the latest workflow run on the default branch, excluding dependabot
    latest_run=$(gh api "repos/eclipse-glsp/$repo/actions/workflows/$workflow_id/runs?per_page=10&branch=$default_branch" \
      --jq ".workflow_runs[] | select(.actor.login != \"dependabot[bot]\") | {
        id: .id,
        status: .status,
        conclusion: .conclusion,
        created_at: .created_at,
        html_url: .html_url,
        head_sha: .head_sha,
        actor: .actor.login
      }" | head -n 1)
    
    if [ -z "$latest_run" ]; then
      echo "    No recent runs found (excluding dependabot)"
      repo_workflows+=("| $workflow_name | No recent run |")
      continue
    fi
    
    run_status=$(echo "$latest_run" | jq -r '.status')
    run_conclusion=$(echo "$latest_run" | jq -r '.conclusion')
    run_url=$(echo "$latest_run" | jq -r '.html_url')
    run_actor=$(echo "$latest_run" | jq -r '.actor')
    run_date=$(echo "$latest_run" | jq -r '.created_at' | cut -d'T' -f1)
    
    # Determine if job failed or succeeded and format status
    if [ "$run_conclusion" = "failure" ] || [ "$run_conclusion" = "cancelled" ] || [ "$run_conclusion" = "timed_out" ]; then
      total_failed=$((total_failed + 1))
      status_link="[$run_conclusion]($run_url)"
      failed_jobs+=("| $repo | $workflow_name | $status_link |")
      repo_workflows+=("| $workflow_name | $status_link |")
    elif [ "$run_conclusion" = "success" ]; then
      total_success=$((total_success + 1))
      status_link="[success]($run_url)"
      repo_workflows+=("| $workflow_name | $status_link |")
    elif [ "$run_status" = "in_progress" ] || [ "$run_status" = "queued" ]; then
      status_link="[$run_status]($run_url)"
      repo_workflows+=("| $workflow_name | $status_link |")
    else
      status_link="[$run_conclusion]($run_url)"
      repo_workflows+=("| $workflow_name | $status_link |")
    fi
    
  done <<< "$(echo "$workflows" | jq -c '.')"
  
  # Build repo details section with table
  if [ ${#repo_workflows[@]} -gt 0 ]; then
    repo_section="## $repo ($repo_workflow_count workflows)~| Workflow | Status |~|---|---|"
    for workflow in "${repo_workflows[@]}"; do
      repo_section="$repo_section~$workflow"
    done
    repo_details+=("$repo_section")
  else
    repo_details+=("## $repo~~No active workflows found")
  fi
  
done

# Generate the final report
echo ""
echo "## Overview"
echo ""
echo "- **Total Repositories:** $total_repos"
echo "- **Total Workflows:** $total_workflows"
echo "- **Failed Jobs:** $total_failed"
echo "- **Successful Jobs:** $total_success"
echo ""

if [ ${#failed_jobs[@]} -gt 0 ]; then
  echo "### Failed Jobs Summary"
  echo ""
  echo "| Repository | Workflow | Status |"
  echo "|---|---|---|"
  for job in "${failed_jobs[@]}"; do
    echo "$job"
  done
  echo ""
else
  echo "### Failed Jobs Summary"
  echo ""
  echo "🎉 No failed jobs found!"
  echo ""
fi

echo "## Repository Details"
echo ""

for detail in "${repo_details[@]}"; do
  echo "$detail" | tr '~' '\n'
  echo ""
done

# Export to GitHub Step Summary for workflow output
if [ -n "$GITHUB_STEP_SUMMARY" ]; then
  {
    echo "# Eclipse GLSP Workflow Status"
    echo ""
    echo "Overview of all Workflows in the Eclipse GLSP organization running on master or main"
    echo ""
    echo "Generated on: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
    echo ""
    echo "## Overview"
    echo ""
    echo "- **Total Repositories:** $total_repos"
    echo "- **Total Workflows:** $total_workflows"
    echo "- **Failed Jobs:** $total_failed"
    echo "- **Successful Jobs:** $total_success"
    echo ""
    
    if [ ${#failed_jobs[@]} -gt 0 ]; then
      echo "### Failed Jobs Summary"
      echo ""
      echo "| Repository | Workflow | Status |"
      echo "|---|---|---|"
      for job in "${failed_jobs[@]}"; do
        echo "$job"
      done
      echo ""
    else
      echo "### Failed Jobs Summary"
      echo ""
      echo "🎉 No failed jobs found!"
      echo ""
    fi
    
    echo "## Repository Details"
    echo ""
    
    for detail in "${repo_details[@]}"; do
      echo "$detail" | tr '~' '\n'
      echo ""
    done
  } >> "$GITHUB_STEP_SUMMARY"
  
  echo "Summary exported to GitHub Step Summary"
fi