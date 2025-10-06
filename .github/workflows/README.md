# GitHub Actions Workflows

## Copilot Setup Steps Workflow

### Overview
The `copilot-setup-steps.yml` workflow automates the setup, build, test, lint, and validation process for the All Things Wetaskiwin application. This workflow is designed to work both with and without a MongoDB connection, gracefully handling partial failures during development.

### Triggers

#### Automatic Triggers
- **Push to main branch**: Runs full workflow with partial failures allowed
- **Pull requests to main**: Runs full workflow with partial failures allowed

#### Manual Trigger
Go to **Actions** → **All Things Wetaskiwin Setup** → **Run workflow**

### Workflow Inputs (Manual Trigger Only)

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `run_tests` | choice | `true` | Run the test suite |
| `run_lint` | choice | `true` | Run linting |
| `perform_validation` | choice | `true` | Run endpoint validation |
| `allow_partial_failures` | choice | `true` | Continue on test/lint failures |

### Workflow Steps

1. **Checkout repository** - Gets the latest code
2. **Show runtime context** - Displays environment information
3. **Setup Node.js (20.x)** - Installs Node.js with caching
4. **Install dependencies** - Runs `npm ci` (~30-60s)
5. **Report environment** - Shows configuration status
6. **Build application** - Runs `npm run build` (~20s)
7. **Run tests** - Executes test suite (~11s)
8. **Lint** - Runs linting (~6s)
9. **Validate endpoints** - Starts dev server and tests routes
10. **Summary** - Generates workflow summary
11. **Archive logs** - Saves dev.log for debugging

### Environment Variables

#### Required (Set in Repository Secrets)
- `MONGODB_URI` - MongoDB Atlas connection string (optional for builds)

#### Automatically Set
- `NEXTAUTH_URL` - Set to `http://localhost:3000`
- `NEXTAUTH_SECRET` - Dummy secret for CI
- `JWT_SECRET` - Dummy secret for CI
- `JWT_REFRESH_SECRET` - Dummy secret for CI

### Behavior

#### With MongoDB Connection
- All tests run against real database
- Full feature validation
- More comprehensive testing

#### Without MongoDB Connection (Graceful Mode)
- Build succeeds (static generation)
- Some tests may fail (expected)
- API endpoints return graceful errors
- Development still possible

### Partial Failures

The workflow supports "partial failures" mode:

- **Enabled** (default for push/PR): Tests and lint can fail without failing the workflow
- **Disabled** (optional for manual runs): Tests and lint failures will fail the workflow

This allows CI to continue even with known test failures (e.g., due to missing database connection).

### Success Criteria

✅ Workflow succeeds when:
- Build completes successfully
- Dev server starts and responds (if validation enabled)
- Core pages are accessible
- API endpoints respond (even with errors)

### Viewing Results

1. **Workflow Summary**: Check the Summary step for quick overview
2. **Step Logs**: Click on individual steps to see detailed logs
3. **Artifacts**: Download `dev.log` for dev server output

### Troubleshooting

#### Build Failures
- Check Node.js version (requires 20.x)
- Verify TypeScript compilation errors
- Review build logs for details

#### Test Failures
- Check if MongoDB is connected (some failures expected without DB)
- Review test logs for specific failures
- Verify environment variables are set

#### Timeout Issues
- Build timeout: 5 minutes (should complete in ~20s)
- Test timeout: 5 minutes (should complete in ~11s)
- Lint timeout: 3 minutes (should complete in ~6s)
- Validation timeout: 6 minutes

#### Dev Server Won't Start
- Check for port conflicts (uses 3000)
- Review dev.log artifact
- Verify build succeeded

### Performance Expectations

| Step | Expected Time |
|------|--------------|
| Install dependencies | 30-60s |
| Build | ~20s |
| Tests | ~11s |
| Lint | ~6s |
| Dev server startup | ~5s |
| Total workflow | ~2-3 minutes |

### Recent Changes

**January 2025** - Fixed conditional logic:
- Corrected malformed bash conditionals
- Enhanced error messaging
- Improved dev server cleanup
- Added comprehensive documentation

See `WORKFLOW_FIXES.md` for technical details.

### Related Documentation

- [Workflow Fixes](./WORKFLOW_FIXES.md) - Technical fix documentation
- [Copilot Instructions](../copilot-instructions.md) - Development setup
- [Deployment Checklist](../../DEPLOYMENT_CHECKLIST.md) - Production deployment
- [Testing Guide](../../TESTING_GUIDE.md) - Testing procedures

### Support

For issues with this workflow:
1. Check the workflow run logs
2. Review this documentation
3. Check `WORKFLOW_FIXES.md` for recent changes
4. Review workflow file comments

### Customization

To modify this workflow:
1. Edit `.github/workflows/copilot-setup-steps.yml`
2. Test changes on a feature branch
3. Use manual trigger to validate
4. Monitor workflow runs
5. Update this documentation

### Best Practices

- **Always review workflow runs** after changes
- **Use manual trigger** to test different scenarios
- **Monitor build times** to catch performance regressions
- **Keep environment secrets secure** in repository settings
- **Review artifacts** when debugging failures

---

**Last Updated:** January 2025  
**Maintained By:** Development Team  
**Status:** ✅ Active and Working
