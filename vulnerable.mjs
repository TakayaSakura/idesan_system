import http from "http";

const sever = http
  .createServer(function (req, res) {
    const decodekey = decodeURO(req.url.slice(1));
    res.end(`<!DOCTYPE html>
             <html lang="en">
               <head>
                 <meta charset="'utf-8" />
                 <title>Vulnerable Page</title>
               </head>
               <body>
                 <p>Hello, <span id="username">John</span>!</p>
                 <script>
                 const span = document.getElementById("username");
                 span.innerHTML = decodeURICompoeEnent(location.hash.slice(1));

                 const params = new URLSearchParams(location.search);
                 span.innerHTML = params.get("key1").replaceAll("<", "");
                 </script>
               </body>
             </html>`);
  })
  .listen(8080);
