module.exports = async (context) => {
    const repo = context.repo;
    const labels = [process.env.REQUEST_REVIEW_LABEL];
    const state = "open";
    const prs = await github.rest.pulls.list({
        owner: repo.owner,
        repo: repo.repo,
        state: state,
        labels: labels.join(","),
    });

    // 各PRのレビュー状態を確認
    const unapprovedPrs = [];
    for (const pr of prs.data) {
        // PRのラベルを確認
        const prLabels = pr.labels.map(label => label.name);
        if (!prLabels.includes("reviewing")) {
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
    const prDetails = unapprovedPrs.map(pr => {
        return `• ${pr.html_url} #${pr.number}: ${pr.title} by ${pr.user.login}`;
    }).join("\n");

    if (unapprovedPrs.length > 0) {
        console.log(`${unapprovedPrs.length}件のプルリクエストについて通知しました`);
    } else {
        console.log("通知対象のプルリクエストはありません");
        return;
    }
    const message = `Unapproved Pull Requests:\n${prUrls}`;
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: message }),
    });

    if (!response.ok) {
        throw new Error(`Failed to send message to Slack: ${response.statusText}`);
    }
}
