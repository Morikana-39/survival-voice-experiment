export type InformationPage = 'consent' | 'instructions' | 'scenario';
export const INFORMATION_TITLES = {
  consent: '知情同意',
  instructions: '实验说明',
  scenario: '沙漠中的一次经历',
};
export function ScenarioInformation() {
  return (
    <section className="scenario-information" aria-label="沙漠中的一次经历">
      <div className="scenario-facts">
        <span>8 月中旬</span>
        <span>上午 10:00</span>
        <span>美国西南部 · 索诺兰沙漠</span>
      </div>
      <div className="scenario-copy">
        <p>
          想象您和几位同伴正在美国旅行。8月中旬的一个上午，约10点，您乘坐的小型飞机在索诺兰沙漠中迫降。
        </p>
        <p>
          您和同伴都能正常行动，但无法使用通讯设备。周围环境炎热干燥，暂时看不到居民点，救援到达的时间也无法确定。您们从飞机中取出了下面12件物品。
        </p>
        <p>
          您的任务是根据这些物品对团队生存的重要性进行排序：第1位表示最重要，第12位表示最不重要。请仅依据当前情境和自己的判断完成排序。
        </p>
      </div>
      <p className="subtle">
        该情境为研究用途的虚构场景，不代表现实中的野外求生建议。排序时，您可以随时查看物品的数量和规格。
      </p>
    </section>
  );
}
export function InstructionInformation() {
  return (
    <>
      <div className="instruction-steps">
        {[
        [
            '独立判断',
            '请先阅读情境，并根据自己的理解将全部物品按生存重要性排序。请根据个人判断完成排序，没有唯一正确答案。',
          ],
          [
            '逐项交流',
            '您将先选择或说明自己的理由，然后收听 AI 语音助手提供的信息。物品讨论顺序由系统预先设定，与您之前的排序结果无关。',
          ],
          [
            '重新评估',
            '所有物品讨论完成后，您将看到相关信息，并有机会重新评估自己的排序。',
          ],
          ['分享感受', '最后，请根据您在实验过程中的真实体验完成问卷。'],
        ].map(([title, detail], i) => (
          <div key={title}>
            <span>{i + 1}</span>
            <div>
              <h2>{title}</h2>
              <p>{detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="notice-card">
        <p>
          请独立完成实验，不搜索资料，也不要与他人讨论。AI
          助手提供的信息仅作为参考，请结合自己的判断进行评估。
        </p>
      </div>
    </>
  );
}
type InformationConfig = {
  researcher: string;
  institution: string;
  contact: string;
  retention: string;
  ethics: string;
} | null;
export function ConsentInformation({ config }: { config: InformationConfig }) {
  return (
    <div className="consent-copy">
        <p>
        本研究关注人们对AI语音助手的感受。您将阅读一个虚构的沙漠生存情境，对 12
        件物品排序，逐项选择或输入理由、收听助手的反馈，然后有机会重新调整排序并填写
        5 道问卷题。
      </p>
      <p>
        参与完全自愿，您可以在最终提交前点击“退出实验”。确认退出后，您将无法再次参与本实验。如因情境内容感到不适，可随时退出。
      </p>
      <p>
        我们记录年龄、性别选项、排序、理由选项和文字、语音播放情况和完成时间，不要求姓名或手机号，也不录制您的声音。请不要在理由中输入身份或联系方式。退出后，本次实验产生的回答记录与基本信息将被删除；仅保留匿名参与状态信息，以避免重复参与。
      </p>
      <p>由于部分信息可能影响实验结果，完整研究目的将在实验结束后向您说明。</p>
      <p className="draft-note">
        未成年人正式参与前，研究人员需落实经审核的监护人许可、参与者本人同意及数据保护流程。本页的勾选不能代替监护人许可；预览测试请勿提交未成年人的真实资料。
      </p>
      {config?.contact ? (
        <p>
          研究人员：{config.researcher}（{config.institution}）<br />
          联系方式：{config.contact}
          <br />
          数据保存：{config.retention}
          {config.ethics && (
            <>
              <br />
              伦理审核编号：{config.ethics}
            </>
          )}
        </p>
      ) : (
        <p className="draft-note">
          预览提示：正式招募前，研究人员将补充机构、联系方式、数据保存期限和经确认的知情同意说明。
        </p>
      )}
    </div>
  );
}
