module.exports = async (github, context) => {
    const repo = context.repo;
    const targetLabel = `${process.env.TARGET_LABEL}`;
    
    const prs = await github.rest.pulls.list({
        owner: repo.owner,
        repo: repo.repo,
        state: "open",
        labels: targetLabel,
    });

    // 各PRで未承認かつレビュー待ち状態かを確認
    const unapprovedPrs = [];
    for (const pr of prs.data) {
        // PRのラベルを確認
        const prLabels = pr.labels.map(label => label.name);
        if (!prLabels.includes(targetLabel)) {
            continue;
        }

        // レビュー情報を取得
        const reviews = await github.rest.pulls.listReviews({
            owner: repo.owner,
            repo: repo.repo,
            pull_number: pr.number
        });

        // APPROVEDレビューの数をカウント
        const approveCount = reviews.data.filter(review =>
            review.state === 'APPROVED'
        ).length;

        // Approveが2件未満の場合、通知対象に追加
        if (approveCount < 2) {
            unapprovedPrs.push(pr);
        }
    }

    // PRの情報を整形
    const prefix = `ℹ️ ${repo.repo} PR状況のお知らせ 💁\n\n`;
    let prDetailText = "";
    let message = `${prefix}レビュー待ちのプルリクエストはありません 🏝️`;

    if (unapprovedPrs.length > 0) {
        prDetailText = unapprovedPrs.map(pr => {
            return ` <${pr.html_url}|${pr.title}> by (${pr.user.login})`;
        }).join("\n");
        message = `${prefix}⚠️ 承認者2名未満のPR\n${prDetailText}`;
        console.log(`${unapprovedPrs.length}件のプルリクエストについて通知します`);
    } else {
        console.log("通知対象のプルリクエストはありません");
    }
    
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text: "現時点で未承認のPR" + (unapprovedPrs.length > 0 ? "があります" : "はありません"),
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: message,
                    },
                },
            ],
            username: "PR未承認案内",
            icon_emoji: ":github-octocat:",
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to send message to Slack: ${response.statusText}`);
    }
}
