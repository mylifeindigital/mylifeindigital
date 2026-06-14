# Branching notes

## Git Branching Strategy

- The understanding is that we will split the code repo and the content repo into their own respective repos. Thus the branching for the code repository would follow a conventional approach: for new change requests we create a change-request branch - not sure if it should be an explicit feature branch and whether we would configure CI/CD with multiple deployable environments - seems overkill to have to create separate hosted environments. For change-requests we create a branch from main and do the dev work. 
- For content creation I'm not sure whether creating separate branches is needed? If I write some new content it should have draft status set to true by default. Why would you want to create a separate branch for the content?

## Protecting main (default) branches

Protect `main` in both the application and content repositories before enabling GitHub Actions production deployment.

Baseline protection:

- Require changes to reach `main` through a pull request.
- Require relevant CI checks to pass before merge.
- Block force pushes and branch deletion.
- Require review conversations to be resolved.
- Do not require another person's approval initially because this is a single-author project.
- Allow administrative bypass only for recovery, not routine work.

GitHub Actions should separate validation from production deployment:

- Pull requests run build-only validation and do not deploy.
- Application `main` merges validate the selected application and content commits, then deploy their combined Worker bundle.
- Content `main` merges trigger the same production deployment workflow because content must be compiled into `web/src/utils/posts-data.ts`.
- Only one workflow should own production deployment to avoid duplicate or competing deployments.

The application and content repositories have separate change histories, but deployment combines an application commit and content commit into one Worker artifact.