const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

module.exports = async (context) => {
    const repo = context.repo;
    const labels = ["reviewing"];
    const state = "open";

    // オープン状態で「reviewing」ラベルがついているPRを取得
    const prs = await octokit.pulls.list({
        owner: repo.owner,
        repo: repo.repo,
        state: state,
        labels: labels.join(","),
    });

    // 各PRのレビュー状態を確認
    const unapprovedPrs = [];
    for (const pr of prs.data) {
        const reviews = await octokit.pulls.listReviews({
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

    // 通知対象のPRがある場合、Slackに通知
    if (unapprovedPrs.length > 0) {
        const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

        // PRの情報を整形
        const prDetails = unapprovedPrs.map(pr => {
            return `• <${pr.html_url}|#${pr.number}: ${pr.title}> by ${pr.user.login}`;
        }).join("\n");

        const message = {
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: "🔍 *Approveが2件未満の「reviewing」ラベルがついているプルリクエスト*"
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: prDetails
                    }
                }
            ]
        };

        // Slackに通知を送信
        const response = await fetch(slackWebhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            throw new Error(`Slackへの通知に失敗しました: ${response.statusText}`);
        }

        console.log(`${unapprovedPrs.length}件のプルリクエストについて通知しました`);
    } else {
        console.log("通知対象のプルリクエストはありません");
    }
}
