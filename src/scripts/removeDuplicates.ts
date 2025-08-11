import "dotenv/config"; // .envファイルを読み込む
import { QdrantClient } from "@qdrant/js-client-rest";
import { getValidatedEnv } from "@/lib/env";
import logger from "@/lib/logger";

interface ProjectPayload {
  title: string;
  projectDescription?: string;
  howItsMade?: string;
  sourceCode?: string;
  link?: string;
  hackathon?: string;
  lastUpdated?: string;
}

interface ProjectPoint {
  id: string | number;
  payload: ProjectPayload;
  vector?: number[];
}

async function removeDuplicates() {
  const env = getValidatedEnv();
  const client = new QdrantClient({
    url: env.QD_URL,
    apiKey: env.QD_API_KEY,
  });

  try {
    logger.info("重複データの検出を開始します...");

    // すべてのデータを取得
    const scrollResult = await client.scroll("eth_global_showcase", {
      limit: 10000,
      with_payload: true,
    });

    const points = scrollResult.points as unknown as ProjectPoint[];
    logger.info(`総データ数: ${points.length}`);

    // リンクベースで重複を検出
    const linkMap = new Map<string, ProjectPoint[]>();
    const titleHackathonMap = new Map<string, ProjectPoint[]>();

    for (const point of points) {
      // リンクによるグルーピング
      if (point.payload?.link) {
        // リンクの正規化（末尾スラッシュを削除、小文字化）
        const normalizedLink = point.payload.link
          .toLowerCase()
          .replace(/\/$/, "")
          .replace(/^https?:\/\//, ""); // プロトコルも削除

        if (!linkMap.has(normalizedLink)) {
          linkMap.set(normalizedLink, []);
        }
        linkMap.get(normalizedLink)!.push(point);
      }

      // タイトル + ハッカソンによるグルーピング（リンクがない場合の重複検出）
      if (point.payload?.title && point.payload?.hackathon) {
        const key = `${point.payload.title.toLowerCase().trim()}_${point.payload.hackathon.toLowerCase().trim()}`;
        if (!titleHackathonMap.has(key)) {
          titleHackathonMap.set(key, []);
        }
        titleHackathonMap.get(key)!.push(point);
      }
    }

    const duplicatesToDelete: (string | number)[] = [];
    const processedIds = new Set<string | number>();

    // リンクベースの重複処理
    logger.info("\n=== リンクベースの重複検出 ===");
    for (const [link, duplicatePoints] of linkMap.entries()) {
      if (duplicatePoints.length > 1) {
        logger.info(`\n重複発見 (リンク: ${link}):`);

        // 最新のデータを保持（lastUpdatedが最新、またはIDが最小のもの）
        const sortedPoints = duplicatePoints.sort((a, b) => {
          // lastUpdatedで比較
          if (a.payload.lastUpdated && b.payload.lastUpdated) {
            return (
              new Date(b.payload.lastUpdated).getTime() -
              new Date(a.payload.lastUpdated).getTime()
            );
          }
          // lastUpdatedがない場合はIDで比較（小さい方を保持）
          return String(a.id).localeCompare(String(b.id));
        });

        const keepPoint = sortedPoints[0];
        logger.info(
          `  保持: ID=${keepPoint.id}, Title="${keepPoint.payload.title}", Hackathon="${keepPoint.payload.hackathon}"`,
        );
        processedIds.add(keepPoint.id);

        // 残りは削除対象
        for (let i = 1; i < sortedPoints.length; i++) {
          const deletePoint = sortedPoints[i];
          if (!processedIds.has(deletePoint.id)) {
            duplicatesToDelete.push(deletePoint.id);
            processedIds.add(deletePoint.id);
            logger.info(
              `  削除: ID=${deletePoint.id}, Title="${deletePoint.payload.title}", Hackathon="${deletePoint.payload.hackathon}"`,
            );
          }
        }
      }
    }

    // タイトル+ハッカソンベースの重複処理（リンクがない場合）
    logger.info("\n=== タイトル+ハッカソンベースの重複検出 ===");
    for (const [key, duplicatePoints] of titleHackathonMap.entries()) {
      // 既に処理済みのポイントをフィルタリング
      const unprocessedPoints = duplicatePoints.filter(
        (p) => !processedIds.has(p.id),
      );

      if (unprocessedPoints.length > 1) {
        const [title, hackathon] = key.split("_");
        logger.info(
          `\n重複発見 (タイトル: "${title}", ハッカソン: "${hackathon}"):`,
        );

        // 最新のデータを保持
        const sortedPoints = unprocessedPoints.sort((a, b) => {
          // lastUpdatedで比較
          if (a.payload.lastUpdated && b.payload.lastUpdated) {
            return (
              new Date(b.payload.lastUpdated).getTime() -
              new Date(a.payload.lastUpdated).getTime()
            );
          }
          // より詳細な情報を持つものを優先
          const aScore =
            (a.payload.projectDescription?.length || 0) +
            (a.payload.howItsMade?.length || 0) +
            (a.payload.sourceCode ? 100 : 0) +
            (a.payload.link ? 50 : 0);
          const bScore =
            (b.payload.projectDescription?.length || 0) +
            (b.payload.howItsMade?.length || 0) +
            (b.payload.sourceCode ? 100 : 0) +
            (b.payload.link ? 50 : 0);
          return bScore - aScore;
        });

        const keepPoint = sortedPoints[0];
        logger.info(
          `  保持: ID=${keepPoint.id}, Link="${keepPoint.payload.link || "なし"}"`,
        );
        processedIds.add(keepPoint.id);

        // 残りは削除対象
        for (let i = 1; i < sortedPoints.length; i++) {
          const deletePoint = sortedPoints[i];
          if (!processedIds.has(deletePoint.id)) {
            duplicatesToDelete.push(deletePoint.id);
            processedIds.add(deletePoint.id);
            logger.info(
              `  削除: ID=${deletePoint.id}, Link="${deletePoint.payload.link || "なし"}"`,
            );
          }
        }
      }
    }

    logger.info(`\n=== 削除サマリー ===`);
    logger.info(`削除対象の重複データ数: ${duplicatesToDelete.length}`);
    logger.info(
      `保持するデータ数: ${points.length - duplicatesToDelete.length}`,
    );

    if (duplicatesToDelete.length > 0) {
      logger.info("\n重複データを削除しています...");

      // バッチで削除（一度に大量のIDを削除しないように）
      const batchSize = 100;
      for (let i = 0; i < duplicatesToDelete.length; i += batchSize) {
        const batch = duplicatesToDelete.slice(i, i + batchSize);
        await client.delete("eth_global_showcase", {
          wait: true,
          points: batch,
        });
        logger.info(
          `削除進捗: ${Math.min(i + batchSize, duplicatesToDelete.length)}/${duplicatesToDelete.length}`,
        );
      }

      logger.info("重複データの削除が完了しました！");
    } else {
      logger.info("重複データは見つかりませんでした。");
    }
  } catch (error) {
    logger.error("重複削除処理中にエラーが発生しました:", error);
    throw error;
  }
}

// スクリプトを実行
if (require.main === module) {
  removeDuplicates()
    .then(() => {
      logger.info("処理が正常に完了しました");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("エラーが発生しました:", error);
      process.exit(1);
    });
}

export { removeDuplicates };
