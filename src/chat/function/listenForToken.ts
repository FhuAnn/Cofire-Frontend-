import * as http from "http";
import * as path from "path";
import * as fs from "fs";

export default function listenForToken() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.url && req.url.startsWith("/callback")) {
        const urlObj = new URL(req.url, "http://localhost:5173");
        const token = urlObj.searchParams.get("token");
        const htmlPath = path.join(
          __dirname,
          "../../static/callback-success.html"
        );
        fs.readFile(htmlPath, "utf8", (err, data) => {
          res.writeHead(200, { "Content-Type": "text/html" });
          if (err) {
            res.end("<h2>Login successful! You can close this tab.</h2>");
          } else {
            res.end(data);
          }
          server.close();
          resolve(token);
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(5173, () => {
      console.log(
        "Listening for OAuth callback on http://localhost:5173/callback"
      );
    });
  });
}
