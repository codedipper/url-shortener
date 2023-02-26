const cfg = require("./config.json");
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");

function isURL(str){ // https://stackoverflow.com/a/22648406
     var urlRegex = "^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$";
     var url = new RegExp(urlRegex, "i");
     return str.length < 2083 && url.test(str.toString());
}

function hash(str){
     return crypto.createHash("sha256").update(str.toString()).digest("hex");
}

function name(){
    var c = "";
    var ch = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";

    for (var i = 0; i < cfg.length; i++){
        c += ch.split("")[Math.floor(Math.random() * ch.length)];
    }

    return c;
};

if (!fs.existsSync("urls")) fs.mkdirSync("urls");

const server = http.createServer(function(req, res){
    if (req.url === "/url" && req.method === "POST"){
        const chs = [];
        req.on("data", function(ch){chs.push(ch)});
        req.on("end", function(){
            res.writeHead(200, { "Content-Type": "text/plain" });

            const data = Buffer.concat(chs);
            var urlname = name();

            if (isURL(data)){
                do {
                    urlname = name();
	        } while (fs.existsSync("./urls/" + hash(urlname)));

                fs.writeFile("./urls/" + hash(urlname), data, function(e){ if (e) throw e; });
	    }

            res.write("https://" + req.headers.host + "/" + urlname);
            res.end();
        });
    } else if (fs.existsSync("./urls/" + hash(req.url.slice(1)))){
         res.writeHead(301, {
           "Location": fs.readFileSync("./urls/" + hash(req.url.slice(1))).toString()
         });
         res.end();
    } else {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.write("curl -X POST -H \"Accept: text/plain\" -H \"Content-Type: text/plain\" -d \"https://revvy.de\" https://" + req.headers.host + "/url");
        res.end();
    }
});

server.listen(cfg.port, cfg.host, function(){
    console.log("Server running at http://" + cfg.host + ":" + cfg.port);
});
