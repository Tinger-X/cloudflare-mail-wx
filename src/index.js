import * as PostalMime from "postal-mime";

function buildPayload(env, edata) {
  return {
    option: {
      template: env.Template,
      detail: {
        ttl: env.ContentTtl,
        content: edata?.html
      }
    },
    params: {
      sender: edata?.from?.address,
      title: edata?.subject
    }
  };
}

async function sendNoticeByHttpFetch(env, payload) {
  // 普通 HTTP 请求较慢，且会消耗 Cloudflare流量
  // 此外：env.NoticeUrl 解析到的IP以`.1`结尾时Email Worker无法HTTP Fetch，但普通worker可以
  // 所以不推荐使用该方式
  await fetch(
    env.NoticeUrl,
    {
      method: "POST",
      headers: {
        [env.NoticeAuthKey]: env.NoticeAuthValue,
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(payload)
    }
  );
}

async function sendNoticeByServiceFetch(env, payload) {
  // 服务绑定方法本地开发时不可用
  const req = new Request(
    env.NoticeUrl,
    {
      method: "POST",
      headers: {
        [env.NoticeAuthKey]: env.NoticeAuthValue,
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(payload)
    }
  );
  try {
    await env.WxNotice.fetch(req);
  } catch(e) {
    console.warn(e.message)
  }
}

async function sendNoticeByRpcCall(env, payload) {
  // 推荐使用该方式
  try {
    await env.WxNotice.sendNotice(payload);
  } catch(e) {
    console.error(e.message)
  }
}

const FnMap = {
  http: sendNoticeByHttpFetch,
  srv: sendNoticeByServiceFetch,
  rpc: sendNoticeByRpcCall
}

export default {
  async email(message, env) {
    const parser = new PostalMime.default();
    const rawEmail = new Response(message.raw);
    const data = await parser.parse(await rawEmail.arrayBuffer());
    const payload = buildPayload(env, data);
    if (!FnMap.hasOwnProperty(env.Method)) {
      console.error(`unknown call method: ${env.Method}`);
    } else {
      await FnMap[env.Method](env, payload);
    }
    await message.forward(env.Receiver);
    return new Response("OK");
  }
};