const AWS = require('aws-sdk');
const bucket = process.env.DASHBOARD_BUCKET ? process.env.DASHBOARD_BUCKET : 'cs-test-s3';
var proxy = require('proxy-agent');
AWS.config.update({
    proxy: process.env.http_proxy,
    httpOptions: {
        agent: proxy(process.env.http_proxy)
    }
});

const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    region: "eu-west-2"
});
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

// takes a URL and returns a new array of objects made from its constituent parts
const urlSplitter = (url) => {
    let components = url.split("/");
    let totalUrl = "/s3/";
    let splitUrls = [];
    components.map((urlPart) => {
        if (urlPart.length) {
            totalUrl += urlPart + "/";
            splitUrls.push({
                url: totalUrl,
                name: urlPart
            });
        }
    });
    console.log(splitUrls);
    return splitUrls;
};

const config = {};

// create the html link to be injected into the template using the object array
const urlSplitterHtml = (splitUrls) => {
    let html = "";
    splitUrls.map((urlItem) => {
        html += `<a href="${urlItem.url}">${urlItem.name}</a>/`;

    })
    return html;
}

const logResponse = (err, data, u) => {
    if (err) console.log("get object", u, err, err.stack);
}

const renderList = (listItems, url) => {

    return listItems.map(item => {

        let linkName = item.Prefix.substr(url.length);
        return `<li class="dir"><a href="/s3/${item.Prefix}">${linkName}</a></li>`;

    });
}

const renderFileList = (objectKeys, url) => {
    const files = [];
    objectKeys.forEach(objectKey => {
        if (path.basename(objectKey) === ".DS_Store") {
            return;
        }

        const linkName = objectKey.substr(url.length);
        const ext = path.extname(objectKey).substr(1).toLowerCase();

        files.push(`<li class="file file--${ext}"><a href="/s3/${objectKey}">${linkName}</a></li>`);
    });

    return files;
}

const renderShortcut = (listItems, url) => {

    const indexHtmlKey = listItems.find(objectKey => {
        return objectKey.endsWith('index.html');
    });

    if (indexHtmlKey) {
        return `<div id="index-link"><a href="/s3/${indexHtmlKey}">index.html</a></div>`;
    }

    return '';
}
// uses a regex to pick out files that are a date and puts them in order with most recent first. Strings are alphabetised.
const sortedLinkNames = (fileToCompareA, fileToCompareB) => {

    let regex = RegExp('[0-9-]{10}_[0-9-]{8}');
    if (regex.test(fileToCompareA.Prefix) && regex.test(fileToCompareB.Prefix)) {
        if (fileToCompareA.Prefix < fileToCompareB.Prefix) {
            return 1;
        }
        if (fileToCompareA.Prefix > fileToCompareB.Prefix) {
            return -1;
        }

        return 0;
    }
    if (regex.test(fileToCompareA.Prefix)) {
        return -1;
    }
    if (regex.test(fileToCompareB.Prefix)) {
        return 1;
    }
    if (fileToCompareA.Prefix < fileToCompareB.Prefix) {
        return -1;
    }
    if (fileToCompareA.Prefix > fileToCompareB.Prefix) {
        return 1;
    }

}

exports = module.exports = {

    setTemplate: (template) => {
        config.template = template;
    },
    dontCache: (patterns) => {
        config.noCache = patterns;
    },
    aws: () => {
        return (req, res, next) => {
            const { url: urlPath } = req;
            const urlPathFinalCharacter = urlPath.charAt(urlPath.length - 1);
            const shouldDisplayBucketContents = urlPathFinalCharacter === "/";

            const bucketPrefix = urlPath.substr(1, urlPath.length);

            if (shouldDisplayBucketContents) {
                console.log(`Listing contents of bucket at: ${bucketPrefix}`);

                const listAllObjects = s3.listObjectsV2({
                    Bucket: bucket,
                    Delimiter: "/",
                    Prefix: bucketPrefix
                }).promise();

                const listIndexFile = s3.listObjectsV2({
                    Bucket: bucket,
                    Delimiter: "/",
                    Prefix: `${bucketPrefix}index.html`
                }).promise();

                // List `index.html` separately because maximum 1,000 objects returned
                Promise.all([listAllObjects, listIndexFile])
                    .then(data => {
                        console.log("Response received for bucket contents: " + bucketPrefix);

                        const objectKeys = data.map(result => result.Contents)
                            .reduce((acc, val) => acc.concat(val), [])
                            .map(object => object.Key)
                            .filter((v, i, a) => a.lastIndexOf(v) === i);

                        const { CommonPrefixes: directories } = data[0];
                        const splitUrl = urlSplitter(bucketPrefix);

                        directories.sort(sortedLinkNames);

                        const links = renderList(directories, bucketPrefix);
                        const fileLinks = renderFileList(objectKeys, bucketPrefix);

                        console.log(urlSplitter(bucketPrefix));
                        const linkHtml = urlSplitterHtml(splitUrl);
                        let html = `<h1>${linkHtml}</h1>`;
                        html += renderShortcut(objectKeys, bucketPrefix);
                        html += "<ul>";
                        html += links.join("");
                        html += fileLinks.join("");
                        html += "</ul>";

                        res.send(config.template(html));
                    })
                    .catch(err => {
                        console.log("get object", bucketPrefix, err, err.stack);
                        res.status(err.statusCode || 500).json(err)
                    });
            } else {
                fs.access('cache/' + bucketPrefix, (err) => {
                    if (err) {
                        var s3Object = s3.getObject({
                            Bucket: bucket,
                            Key: bucketPrefix
                        }, function (err, data) {
                            logResponse(err, data, bucketPrefix)
                            if (!err) {
                                res.type(data.ContentType).send(data.Body);
                                let dir = path.dirname(bucketPrefix);
                                mkdirp('cache/' + dir, (err) => {
                                    if (err) {
                                        console.log("mkdir", err);
                                    }

                                    let noCacheMatches = config.noCache.filter((pattern) => pattern.test(bucketPrefix));
                                    if (noCacheMatches) {
                                        console.log(`Not caching ${bucketPrefix} because it matched noCache pattern(s):  ${noCacheMatches}`);
                                    } else {
                                        fs.writeFile('cache/' + bucketPrefix, data.Body, (err) => {
                                            if (err) {
                                                console.log("write file", err);
                                            }
                                        });
                                    }

                                });
                            } else {
                              res.status(err.statusCode || 500).json(err)
                            }
                        });
                    } else {
                        fs.createReadStream('cache/' + bucketPrefix).pipe(res);
                    }
                });
            }
        };
    }
};
