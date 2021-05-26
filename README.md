# hocs-test-viewer

Proxy/dashboard to view test results from an S3 bucket.

The following environment variables are required:

- `S3_ACCESS_KEY`: AWS access key ID
- `S3_SECRET_KEY`: AWS secret access key
- `DASHBOARD_BUCKET`: name of the S3 bucket
- `DASHBOARD_TITLE` (optional): title to display on the dashboard pages; 
  defaults to *HOCS Test Reports Dashboard*
