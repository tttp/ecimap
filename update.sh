echo "fetching from $1"
curl $1/stats?output=json | sed 's/total/online/' > openeci.json
jq -s add base.json openeci.json > full.json
