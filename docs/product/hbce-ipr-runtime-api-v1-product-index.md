manuelcoletta1@penguin:~/github/hbce-ai-joker-c2$ cd /home/manuelcoletta1/github/hbce-ai-joker-c2 || exit 1

git pull --ff-only origin main

git status -sb

echo
echo "=== VERIFY API v1 PRODUCT CHANGELOG ==="

test -f docs/product/hbce-ipr-runtime-api-v1-changelog.md || {
  echo "FAIL: changelog mancante"
  exit 1
}

wc -l docs/product/hbce-ipr-runtime-api-v1-changelog.md

grep -n "HBCE IPR Runtime API v1 — Product Changelog" docs/product/hbce-ipr-runtime-apiecho "=== API v1 PRODUCT CHANGELOG PASS ==="quota.mjsbce-ipr-runtime-api-v1-changelog.m
remote: Enumerating objects: 8, done.
remote: Counting objects: 100% (8/8), done.
remote: Compressing objects: 100% (5/5), done.
remote: Total 5 (delta 3), reused 0 (delta 0), pack-reused 0 (from 0)
Unpacking objects: 100% (5/5), 3.84 KiB | 178.00 KiB/s, done.
From https://github.com/manuelcoletta1-source/hbce-ai-joker-c2
 * branch            main       -> FETCH_HEAD
   8981537..f4d2ab1  main       -> origin/main
Updating 8981537..f4d2ab1
Fast-forward
 docs/product/hbce-ipr-runtime-api-v1-changelog.md | 457 +++++++++++++++++++++++++++++
 1 file changed, 457 insertions(+)
 create mode 100644 docs/product/hbce-ipr-runtime-api-v1-changelog.md
## main...origin/main

=== VERIFY API v1 PRODUCT CHANGELOG ===
457 docs/product/hbce-ipr-runtime-api-v1-changelog.md
1:# HBCE IPR Runtime API v1 — Product Changelog
8:**Changelog status:** `API v1 product changelog ready`  
70:**Commit:** `8981537`  
137:**Commit:** `054be6c`  
191:**Commit:** `fd1af9b`  
58:ANTI_ABUSO_API_DOCUMENTATION_READY
112:ANTI_ABUSO_API_DOCUMENTATION_READY
162:ANTI_ABUSO_API_DOCUMENTATION_READY
59:API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_DOCUMENTED
113:API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_DOCUMENTED
163:API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_DOCUMENTED
60:API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_PASS
114:API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_PASS
209:API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_PASS
61:RATE_LIMIT_EXCEEDED
115:RATE_LIMIT_EXCEEDED
164:RATE_LIMIT_EXCEEDED
211:RATE_LIMIT_EXCEEDED
265:RATE_LIMIT_EXCEEDED
311:RATE_LIMIT_EXCEEDED
438:HBCE IPR Runtime API v1 product changelog = ready
9:**Boundary:** `legalCertification=false`  
25:legalCertification=false
116:legalCertification=false
123:legalCertification=false
165:legalCertification=false
212:legalCertification=false
258:legalCertification=false
305:legalCertification=false
404:legalCertification=false
455:legalCertification=false
10:**OPC boundary:** technical proof receipt only
26:OPC=technical proof receipt only
117:technical proof receipt only
124:OPC=technical proof receipt only
166:OPC=technical proof receipt only
213:technical proof receipt only
306:technical proof receipt only
405:OPC=technical proof receipt only
456:OPC=technical proof receipt only

=== NODE CHECK RATE LIMIT QUOTA SCRIPT ===

=== API v1 PRODUCT CHANGELOG PASS ===
manuelcoletta1@penguin:~/github/hbce-ai-joker-c2$ 
