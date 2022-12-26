const express  = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const serverless = require("serverless-http");
const request = require('request');
const path = require('path');
let cors = require('cors')

const app = express();
const router = express.Router()

router.use(bodyParser.urlencoded({ extended: false }))
router.use(bodyParser.json())
dotenv.config();

router.get('/', cors(), (req, res) => {
    res.json({msg: 'Hello'})
})

class notionRequestOptions {
    constructor(_method, _url, _authorization){
        this.options = {
            method: _method,
            url: _url,
            headers: {
                accept: 'application/json',
                'Notion-Version': '2022-06-28',
                'content-type': 'application/json',
                'Authorization': _authorization
            }
        }
    }

    requestResult(){
        return this.options 
    }
}

router.get('/head-section', cors(), (req, res) => {
    // Notion API
    const pageId = '9254afe1fade48e785a98ef7cef790b4';
    const url = `https://api.notion.com/v1/pages/${pageId}`;
    const notionAuth = process.env.NOTION_TOKEN;
    const HeadSectionOptions = new notionRequestOptions('GET', url, notionAuth).requestResult();

    request(HeadSectionOptions, function (error, response, body) {
        if (error) throw new Error(error);
        res.send(JSON.stringify(body))
    });
})

router.get('/about-section', cors(), (req, res) => {
    // Notion API
    const pageId = '4f8fa5f65ab44893b559cf1e550857d7';
    const url = `https://api.notion.com/v1/pages/${pageId}`;
    const notionAuth = process.env.NOTION_TOKEN;
    const AboutSectionOptions = new notionRequestOptions('GET', url, notionAuth).requestResult();

    request(AboutSectionOptions, function (error, response, body) {
        if (error) throw new Error(error);
        res.send(JSON.stringify(body))
    });
})

router.get('/gallery-section', cors(), (req, res) => {
    // Notion API
    const parentBlockId = '5a297f64c98b4166afe88b41f1e9baf1';
    const url = `https://api.notion.com/v1/blocks/${parentBlockId}/children`;
    const notionAuth = process.env.NOTION_TOKEN;
    const GallerySectionOptions = new notionRequestOptions('GET', url, notionAuth).requestResult();

    // 2. Fetch child data (Notion Blocks)
    const childData = (requestPageOptions) => {
        return new Promise((resolve, reject) => {
            request(requestPageOptions, function (error, response, childBody) {
                if (error) reject(error);
                resolve(childBody)
            })
        })
    }

    // 1. Fetch parent data (Notion Blocks)
    request(GallerySectionOptions, function (error, response, body) {
        if (error) throw new Error(error);
        const pagesChilds = JSON.parse(body).results;
        
        const pages = Promise.all(pagesChilds.map(async (pageChild) => {
            const childId = pageChild.id;
            const childUrl = `https://api.notion.com/v1/blocks/${childId}/children`;
            const notionAuth = process.env.NOTION_TOKEN;
            const requestPageOptions = new notionRequestOptions('GET', childUrl, notionAuth).requestResult();

            return await childData(requestPageOptions).then(resolve => resolve)
        }))

        // Return array of JSONs.
        pages.then(resolve => res.send(resolve))
    });
})

router.post('/contact-us', cors(), (req, res) => {
    console.log('Triggered')
    const contactUsURL = req.body.original_post_request_url;
    const options = {
        method: 'POST',
        url: 'https://api.notion.com/v1/pages',
        headers: {
            accept: 'application/json',
            'Notion-Version': '2022-06-28',
            'content-type': 'application/json',
            'Authorization': process.env.NOTION_TOKEN
        },
        body: {
            "parent": {
                "type":"database_id",
                "database_id": process.env.NOTION_DATABASE_ID
            },
            "archived": false,
            "properties": {
                "email": {
                    "type": "email",
                    "email": req.body.user_email
                },
                "message": {
                    "type": "rich_text",
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": req.body.message,
                                "link": null
                            },
                            "annotations": {
                                "bold": false,
                                "italic": false,
                                "strikethrough": false,
                                "underline": false,
                                "code": false,
                                "color": "default"
                            },
                            "plain_text": req.body.message,
                            "href": null
                        }
                    ]
                },
                "name": {
                    "type": "rich_text",
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": req.body.user_name,
                                "link": null
                            },
                            "annotations": {
                                "bold": false,
                                "italic": false,
                                "strikethrough": false,
                                "underline": false,
                                "code": false,
                                "color": "default"
                            },
                            "plain_text": req.body.user_name,
                            "href": null
                        }
                    ]
                },
                "subject": {
                    "type": "rich_text",
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": req.body.subject,
                                "link": null
                            },
                            "annotations": {
                                "bold": false,
                                "italic": false,
                                "strikethrough": false,
                                "underline": false,
                                "code": false,
                                "color": "default"
                            },
                            "plain_text": req.body.subject,
                            "href": null
                        }
                    ]
                },
                "Tags": {
                    "type": "multi_select",
                    "multi_select": [
                        {
                            "name": "New | Hubungi Forms",
                            "color": "green"
                        }
                    ]
                },
                "Name": {
                    "type": "title",
                    "title": [
                        {
                            "type": "text",
                            "text": {
                                "content": `Form from ${req.body.user_email}`,
                                "link": null
                            },
                            "annotations": {
                                "bold": false,
                                "italic": false,
                                "strikethrough": false,
                                "underline": false,
                                "code": false,
                                "color": "green"
                            },
                            "plain_text": `Form from ${req.body.user_email}`,
                            "href": null
                        }
                    ]
                }
            }
        },
        json: true
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        console.log(`Success: Data submitted`)
        console.log(contactUsURL)
        res.redirect(contactUsURL)
    });
})

router.post('/email-subscription', cors(), (req, res) => {
    const original_post_request_url = req.body.original_post_request_url;
    const options = {
        method: 'POST',
        url: 'https://api.notion.com/v1/pages',
        headers: {
            accept: 'application/json',
            'Notion-Version': '2022-06-28',
            'content-type': 'application/json',
            'Authorization': process.env.NOTION_TOKEN
        },
        body: {
            "parent": {
                "type":"database_id",
                "database_id": process.env.NOTION_DATABASE_ID
            },
            "archived": false,
            "properties": {
                "email": {
                    "type": "email",
                    "email": req.body.user_email
                },
                "message": {
                    "type": "rich_text",
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": "-",
                                "link": null
                            },
                            "annotations": {
                                "bold": false,
                                "italic": false,
                                "strikethrough": false,
                                "underline": false,
                                "code": false,
                                "color": "default"
                            },
                            "plain_text": "-",
                            "href": null
                        }
                    ]
                },
                "name": {
                    "type": "rich_text",
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": "-",
                                "link": null
                            },
                            "annotations": {
                                "bold": false,
                                "italic": false,
                                "strikethrough": false,
                                "underline": false,
                                "code": false,
                                "color": "default"
                            },
                            "plain_text": "-",
                            "href": null
                        }
                    ]
                },
                "subject": {
                    "type": "rich_text",
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": "-",
                                "link": null
                            },
                            "annotations": {
                                "bold": false,
                                "italic": false,
                                "strikethrough": false,
                                "underline": false,
                                "code": false,
                                "color": "default"
                            },
                            "plain_text": "-",
                            "href": null
                        }
                    ]
                },
                "Tags": {
                    "type": "multi_select",
                    "multi_select": [
                        {
                            "name": "Email subscribers",
                            "color": "green"
                        }
                    ]
                },
                "Name": {
                    "type": "title",
                    "title": [
                        {
                            "type": "text",
                            "text": {
                                "content": `${req.body.user_email} Subscribed`,
                                "link": null
                            },
                            "annotations": {
                                "bold": false,
                                "italic": false,
                                "strikethrough": false,
                                "underline": false,
                                "code": false,
                                "color": "green"
                            },
                            "plain_text": `${req.body.user_email} Subscribed`,
                            "href": null
                        }
                    ]
                }
            }
        },
        json: true
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        console.log(`Success: ${req.body.user_email} just subscribed!`)
        console.log(original_post_request_url)
        res.redirect(original_post_request_url)
    });
})

app.use(router)
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

// Handle local development
module.exports = app;

// Handle production
module.exports.handler = serverless(app);