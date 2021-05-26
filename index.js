const express = require('express');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const app = express();
const serveStatic = require('serve-static');
const proxy = require("./aws-proxy");
const title = process.env.DASHBOARD_TITLE ? process.env.DASHBOARD_TITLE : 'HOCS Test Reports Dashboard';

const createPage = (body) => {

    let html = `<!DOCTYPE html>
    <html>
        <head>
            <title>${title}</title>
            <link href="https://fonts.googleapis.com/css?family=Cabin" rel="stylesheet">
            <link rel="stylesheet" type="text/css" href="/styles/styles.css">
            <link rel="icon" href="https://github.com/alphagov/govuk_frontend_toolkit/blob/master/images/crests/ho_crest_18px.png?raw=true">
        </head>
        <body>
            <h1 class="heading">${title}</h1>
            <div id="border"></div>
            <div id="container">
            <div class="dropdown">
                <button onclick="createDropdown()" class="dropbtn">Quick Links</button>
                    <div id="myDropdown" class="dropdown-content">
                        <a href="/s3/">Root</a>
                        <a href="/s3/qa/">QA</a>
                        <a href="/s3/dev/">Development</a>
                    </div>
            </div class="main-body">
            ${body}
            <a href="javascript:history.go(-1)" id="back-button">Go back</a>
            </div>
        <script src="/main.js"></script>
        </body>
    </html>`
    return html;
};

proxy.setTemplate(createPage);
proxy.dontCache([ /^.*job_status\.log$/ ])

app.use(serveStatic("public/"));

app.use('/s3', proxy.aws());

app.get("/", (req, res) => {
    res.redirect("/s3");
})

// get the health status of the app
app.get('/healthz', (req, res) => {
  res.send({env: process.env.ENV, status: 'OK'})
})

var server = app.listen(3000, () => {
    console.log('Example app listening on port ' + server.address().port);
});
