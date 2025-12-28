#!/bin/bash
# ╔════════════════════════════════════════════════════════════════════════════╗
# ║                    TVS EPIC DEMO: Pi → Mac → Tally!                        ║
# ║                                                                            ║
# ║  This script sets up a complete voting demo:                               ║
# ║  • Mac as "cloud" receiving votes                                          ║
# ║  • Pi as edge node (voters use phones here)                                ║
# ║  • 2 test voters with credentials                                          ║
# ║  • Live sync and tally!                                                    ║
# ╚════════════════════════════════════════════════════════════════════════════╝

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TVS_ROOT="$(dirname "$SCRIPT_DIR")"

# Get Mac's IP address
get_mac_ip() {
    # Try to get the local network IP
    ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost"
}

MAC_IP=$(get_mac_ip)

echo -e "${MAGENTA}"
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║   ████████╗██╗   ██╗███████╗    ██████╗ ███████╗███╗   ███╗ ██████╗        ║"
echo "║   ╚══██╔══╝██║   ██║██╔════╝    ██╔══██╗██╔════╝████╗ ████║██╔═══██╗       ║"
echo "║      ██║   ██║   ██║███████╗    ██║  ██║█████╗  ██╔████╔██║██║   ██║       ║"
echo "║      ██║   ╚██╗ ██╔╝╚════██║    ██║  ██║██╔══╝  ██║╚██╔╝██║██║   ██║       ║"
echo "║      ██║    ╚████╔╝ ███████║    ██████╔╝███████╗██║ ╚═╝ ██║╚██████╔╝       ║"
echo "║      ╚═╝     ╚═══╝  ╚══════╝    ╚═════╝ ╚══════╝╚═╝     ╚═╝ ╚═════╝        ║"
echo "║                                                                            ║"
echo "║                    🗳️  Pi → Mac → Phone → TALLY! 🗳️                        ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${CYAN}Your Mac's IP address: ${BOLD}$MAC_IP${NC}"
echo ""

# Menu
echo -e "${YELLOW}What do you want to do?${NC}"
echo ""
echo "  1) ${GREEN}Start Mac as Cloud${NC} (run this first on your Mac)"
echo "  2) ${BLUE}Create Test Election + 2 Credentials${NC}"
echo "  3) ${MAGENTA}Show Pi Install Command${NC} (run on your Pi)"
echo "  4) ${CYAN}Check Sync Status${NC}"
echo "  5) ${RED}Trigger Tally${NC} (after votes are in!)"
echo "  6) ${YELLOW}Full Demo Guide${NC}"
echo ""
read -p "Enter choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  Starting Mac as Cloud Server...${NC}"
        echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "API will be available at: ${BOLD}http://$MAC_IP:3000${NC}"
        echo -e "Voter app at: ${BOLD}http://$MAC_IP:3001${NC} (if running)"
        echo ""
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
        echo ""

        cd "$TVS_ROOT"
        DEPLOYMENT_MODE=cloud \
        VEILCLOUD_ENABLED=true \
        DISABLE_RATE_LIMIT=true \
        NODE_OPTIONS="--max-old-space-size=4096" \
        npx tsx packages/tvs-api/src/server.ts
        ;;

    2)
        echo ""
        echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
        echo -e "${BLUE}  Creating Test Election + 2 Voter Credentials${NC}"
        echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
        echo ""

        API_URL="http://localhost:3000"

        # Check if API is running
        if ! curl -sf "$API_URL/health" > /dev/null 2>&1; then
            echo -e "${RED}❌ API not running! Start it first with option 1${NC}"
            exit 1
        fi

        echo -e "${GREEN}✓ API is running${NC}"
        echo ""

        # Create organization
        echo "Creating organization..."
        ORG_RESPONSE=$(curl -sf -X POST "$API_URL/api/orgs" \
            -H "Content-Type: application/json" \
            -d '{"name": "Demo County Elections", "type": "government"}')
        ORG_ID=$(echo "$ORG_RESPONSE" | jq -r '.id')
        echo -e "  Organization ID: ${CYAN}$ORG_ID${NC}"

        # Create jurisdiction
        echo "Creating jurisdiction..."
        JURIS_RESPONSE=$(curl -sf -X POST "$API_URL/api/jurisdictions" \
            -H "Content-Type: application/json" \
            -d '{
                "name": "Demo County",
                "code": "US-DEMO-001",
                "type": "county",
                "level": 2,
                "parent": null
            }')
        JURIS_ID=$(echo "$JURIS_RESPONSE" | jq -r '.id')
        echo -e "  Jurisdiction ID: ${CYAN}$JURIS_ID${NC}"

        # Create election
        echo "Creating election..."
        ELECTION_RESPONSE=$(curl -sf -X POST "$API_URL/api/elections" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"Epic Demo Election 2024\",
                \"organizationId\": \"$ORG_ID\",
                \"startDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                \"endDate\": \"$(date -u -v+1d +%Y-%m-%dT%H:%M:%SZ)\",
                \"threshold\": 2,
                \"totalTrustees\": 3
            }")
        ELECTION_ID=$(echo "$ELECTION_RESPONSE" | jq -r '.id')
        echo -e "  Election ID: ${CYAN}$ELECTION_ID${NC}"

        # Add trustees
        echo "Adding trustees..."
        for i in 1 2 3; do
            curl -sf -X POST "$API_URL/api/elections/$ELECTION_ID/trustees" \
                -H "Content-Type: application/json" \
                -d "{\"name\": \"Trustee $i\", \"email\": \"trustee$i@demo.local\"}" > /dev/null
        done
        echo -e "  ${GREEN}✓ 3 trustees added${NC}"

        # Create ballot question
        echo "Creating ballot question..."
        BALLOT_RESPONSE=$(curl -sf -X POST "$API_URL/api/ballot/$ELECTION_ID/questions" \
            -H "Content-Type: application/json" \
            -d "{
                \"jurisdictionId\": \"$JURIS_ID\",
                \"title\": \"Who should win?\",
                \"description\": \"The most important question ever\",
                \"type\": \"single-choice\",
                \"candidates\": [
                    {\"id\": \"alice\", \"name\": \"Alice\", \"party\": \"Awesome Party\"},
                    {\"id\": \"bob\", \"name\": \"Bob\", \"party\": \"Best Party\"}
                ]
            }")
        QUESTION_ID=$(echo "$BALLOT_RESPONSE" | jq -r '.id')
        echo -e "  Question ID: ${CYAN}$QUESTION_ID${NC}"

        # Start key ceremony
        echo "Running key ceremony..."
        curl -sf -X POST "$API_URL/api/elections/$ELECTION_ID/ceremony/start" > /dev/null

        # Submit trustee shares
        for i in 1 2 3; do
            TRUSTEES=$(curl -sf "$API_URL/api/elections/$ELECTION_ID/trustees")
            TRUSTEE_ID=$(echo "$TRUSTEES" | jq -r ".[$((i-1))].id")
            curl -sf -X POST "$API_URL/api/elections/$ELECTION_ID/trustees/$TRUSTEE_ID/share" \
                -H "Content-Type: application/json" \
                -d "{\"share\": \"demo-share-$i\", \"commitment\": \"demo-commitment-$i\"}" > /dev/null
        done
        echo -e "  ${GREEN}✓ Key ceremony complete${NC}"

        # Open voting
        echo "Opening election for voting..."
        curl -sf -X PATCH "$API_URL/api/elections/$ELECTION_ID" \
            -H "Content-Type: application/json" \
            -d '{"status": "voting"}' > /dev/null
        echo -e "  ${GREEN}✓ Election is OPEN!${NC}"

        # Generate 2 voter credentials
        echo ""
        echo "Generating voter credentials..."

        mkdir -p "$TVS_ROOT/demo-credentials"

        for i in 1 2; do
            VOTER_NAME="Voter$i"
            CRED_RESPONSE=$(curl -sf -X POST "$API_URL/api/register/$ELECTION_ID" \
                -H "Content-Type: application/json" \
                -d "{
                    \"jurisdictionId\": \"$JURIS_ID\",
                    \"voterIdHash\": \"voter-$i-$(date +%s)\"
                }")

            # Save credential to file
            echo "$CRED_RESPONSE" | jq '.' > "$TVS_ROOT/demo-credentials/voter$i.json"
        done

        echo ""
        echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  ✅ DEMO SETUP COMPLETE!${NC}"
        echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "Election: ${BOLD}Epic Demo Election 2024${NC}"
        echo -e "Question: ${BOLD}Who should win? (Alice vs Bob)${NC}"
        echo ""
        echo -e "${YELLOW}📁 Voter Credentials saved to:${NC}"
        echo -e "   $TVS_ROOT/demo-credentials/voter1.json"
        echo -e "   $TVS_ROOT/demo-credentials/voter2.json"
        echo ""
        echo -e "${CYAN}📱 To vote on phone:${NC}"
        echo -e "   1. Open http://<pi-ip>/ on your phone"
        echo -e "   2. Paste the credential JSON"
        echo -e "   3. Vote for Alice or Bob!"
        echo ""
        echo -e "${MAGENTA}Election ID: $ELECTION_ID${NC}"
        echo -e "${MAGENTA}Question ID: $QUESTION_ID${NC}"
        echo ""

        # Show credentials
        echo -e "${YELLOW}═══ VOTER 1 CREDENTIAL ═══${NC}"
        cat "$TVS_ROOT/demo-credentials/voter1.json" | jq '.'
        echo ""
        echo -e "${YELLOW}═══ VOTER 2 CREDENTIAL ═══${NC}"
        cat "$TVS_ROOT/demo-credentials/voter2.json" | jq '.'
        echo ""

        # Save election info
        cat > "$TVS_ROOT/demo-credentials/election-info.json" << EOF
{
    "electionId": "$ELECTION_ID",
    "questionId": "$QUESTION_ID",
    "jurisdictionId": "$JURIS_ID",
    "organizationId": "$ORG_ID",
    "macIp": "$MAC_IP",
    "candidates": ["Alice", "Bob"]
}
EOF
        echo -e "${GREEN}Election info saved to: demo-credentials/election-info.json${NC}"
        ;;

    3)
        echo ""
        echo -e "${MAGENTA}════════════════════════════════════════════════════════════${NC}"
        echo -e "${MAGENTA}  Pi Install Command${NC}"
        echo -e "${MAGENTA}════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "Run this on your Raspberry Pi:"
        echo ""
        echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
        echo -e "${BOLD}export CLOUD_SYNC_URL=http://$MAC_IP:3000${NC}"
        echo -e "${BOLD}curl -fsSL https://raw.githubusercontent.com/jasonsutter87/Trustless-Voting-System-tvs-/main/pi-image/install.sh | bash${NC}"
        echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
        echo ""
        echo -e "${YELLOW}After install, the Pi will sync votes to your Mac at $MAC_IP${NC}"
        echo ""
        ;;

    4)
        echo ""
        echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
        echo -e "${CYAN}  Checking Sync Status${NC}"
        echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
        echo ""

        # Check Mac API
        echo -e "Mac API (localhost:3000):"
        if curl -sf "http://localhost:3000/health" > /dev/null 2>&1; then
            curl -sf "http://localhost:3000/health" | jq '.'
        else
            echo -e "  ${RED}Not running${NC}"
        fi

        echo ""
        echo -e "Registered Edge Nodes:"
        if curl -sf "http://localhost:3000/api/sync/nodes" > /dev/null 2>&1; then
            curl -sf "http://localhost:3000/api/sync/nodes" | jq '.'
        else
            echo -e "  ${YELLOW}No nodes registered yet${NC}"
        fi

        echo ""
        echo -e "VeilCloud Data:"
        if [[ -d "$TVS_ROOT/packages/tvs-api/data/veilcloud" ]]; then
            du -sh "$TVS_ROOT/packages/tvs-api/data/veilcloud"
            echo ""
            ls -la "$TVS_ROOT/packages/tvs-api/data/veilcloud/elections/" 2>/dev/null || echo "  No elections yet"
        else
            echo -e "  ${YELLOW}No VeilCloud data yet${NC}"
        fi
        ;;

    5)
        echo ""
        echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED}  🗳️  TRIGGERING TALLY!${NC}"
        echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
        echo ""

        # Load election info
        if [[ ! -f "$TVS_ROOT/demo-credentials/election-info.json" ]]; then
            echo -e "${RED}❌ No election info found. Run option 2 first!${NC}"
            exit 1
        fi

        ELECTION_ID=$(jq -r '.electionId' "$TVS_ROOT/demo-credentials/election-info.json")

        echo "Election ID: $ELECTION_ID"
        echo ""

        # Close election
        echo "Closing election..."
        curl -sf -X PATCH "http://localhost:3000/api/elections/$ELECTION_ID" \
            -H "Content-Type: application/json" \
            -d '{"status": "tallying"}' > /dev/null || true

        # Get results
        echo ""
        echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  📊 ELECTION RESULTS${NC}"
        echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
        echo ""

        # Check vote ledger
        RESULTS=$(curl -sf "http://localhost:3000/api/verify/integrity/$ELECTION_ID" 2>/dev/null || echo '{}')

        if [[ "$RESULTS" != "{}" ]]; then
            echo "$RESULTS" | jq '.'
        else
            echo "Checking VeilCloud directly..."
            ELECTION_DIR="$TVS_ROOT/packages/tvs-api/data/veilcloud/elections"
            if [[ -d "$ELECTION_DIR" ]]; then
                for dir in "$ELECTION_DIR"/*/; do
                    echo ""
                    echo "Election: $(basename $dir)"
                    for qdir in "$dir"/questions/*/; do
                        VOTE_COUNT=$(wc -l < "$qdir/votes.jsonl" 2>/dev/null || echo "0")
                        echo "  Question $(basename $qdir): $VOTE_COUNT votes"
                    done
                done
            fi
        fi

        echo ""
        echo -e "${MAGENTA}🎉 DEMOCRACY IN ACTION! 🎉${NC}"
        ;;

    6)
        echo ""
        echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}  📖 FULL DEMO GUIDE${NC}"
        echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${BOLD}STEP 1: Start Mac as Cloud${NC}"
        echo "  Run this script, choose option 1"
        echo "  Keep this terminal open"
        echo ""
        echo -e "${BOLD}STEP 2: Create Election${NC}"
        echo "  Open NEW terminal"
        echo "  Run this script, choose option 2"
        echo "  Save the voter credentials!"
        echo ""
        echo -e "${BOLD}STEP 3: Setup Pi${NC}"
        echo "  SSH into your Pi"
        echo "  Run: export CLOUD_SYNC_URL=http://$MAC_IP:3000"
        echo "  Run the install script (option 3 shows command)"
        echo ""
        echo -e "${BOLD}STEP 4: Vote on Phone!${NC}"
        echo "  Open phone browser"
        echo "  Go to http://<pi-ip>/"
        echo "  Paste voter1.json credential"
        echo "  Vote for Alice or Bob!"
        echo "  Repeat with voter2.json"
        echo ""
        echo -e "${BOLD}STEP 5: Watch the Magic${NC}"
        echo "  Pi syncs to Mac every 30 seconds"
        echo "  Check status with option 4"
        echo ""
        echo -e "${BOLD}STEP 6: TALLY!${NC}"
        echo "  Run option 5 to see results"
        echo "  🎉 EPIC! 🎉"
        echo ""
        echo -e "${CYAN}Network Diagram:${NC}"
        echo ""
        echo "  ┌──────────────┐         ┌──────────────┐"
        echo "  │  Your Mac    │◄────────│ Raspberry Pi │"
        echo "  │  $MAC_IP     │  sync   │  (edge node) │"
        echo "  │  Port 3000   │         │  Port 3000   │"
        echo "  │              │         │       ▲      │"
        echo "  │  TALLY HERE  │         │       │      │"
        echo "  └──────────────┘         └───────┼──────┘"
        echo "                                   │"
        echo "                            ┌──────┴──────┐"
        echo "                            │ 📱 Phone    │"
        echo "                            │ Vote here!  │"
        echo "                            └─────────────┘"
        echo ""
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
