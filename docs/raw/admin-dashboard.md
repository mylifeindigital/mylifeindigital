# Admin dashboard

In reference to the change request -
[CR-018: Decide Web Admin Role After Content Repository Split](../../change-requests/CR-018-decide-web-admin-role-after-content-repository-split.md) it is important to take note that we use git as our source of truth. Using git directly in an admin dashboard feels counter intuitive because its purpose has always leaned itself to source control for code. The content being processed in `mylifeindigital.content` and `story-crafter` use Markdown for the most part with scripts in some areas. 

## Is git the only option

Is a git repo a good candidate for an admin dashboard?

There is an option on cloudflare called Artifacts. It does require creating a $20usd subscription. can i really justify the expense? also i would need to request access. Cloudflare Artifacts is not publicly available

- [Artifacts](./cloudflare/artifacts.md)

## What purpose would an admin dashboard serve?

I'm not going to author content using the admin dashboard at the moment. Or should I consider it? If the way I create content remains in the use of Visual Studio Code does it end up creating a dependency on VSCode? Lets just answer the question - what purpose would an admin dashboard serve? what purpose would it serve in the purpose of what is being engineered?
