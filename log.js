/* 夢アカ 予約・受付：操作の記録（社内の試験用）。
   画面から受け口に送った操作と、その結果を、表の「操作ログ」に残す。
   鍵・専用リンク・写真・登録コードは送らない。 */
(function(){
var LOG='https://yasuulab-n8n.xvps.jp/webhook/yumeaka-yoyaku-log-7d31e4';
var SKIP={face:1,photos:1,roster:1,nextday:1,who:1,config:1};
var NAMES={open:'受付の画面を開く',scan:'QRを読み取る',tap:'名前から受け付ける',photo:'顔写真を保存する',register:'端末を登録する',forget:'端末の登録を消す',overview:'運営画面を開く',addLecture:'講義を足す',stopLecture:'講義を中止する',addDay:'活動日を足す',editLecture:'講義を直す',editDay:'活動日を直す',stopDay:'活動日を中止する',stopDevice:'端末を止める',removePhoto:'顔写真を消す',me:'自分の登録を開く',confirm:'登録の内容を確かめる',view:'予約のページを開く',reserve:'予約する',joinLecture:'講義に参加する',leaveLecture:'講義の参加をやめる',cancel:'予約を取り消す',reset:'環境をリセットする',promote:'順番待ちから予約に切り替える',demote:'順番待ちに戻す',addNotice:'お知らせを出す',editNotice:'お知らせを直す',dropNotice:'お知らせを取り下げる',bindSpare:'予備のネームプレートを結びつける',unbindSpare:'予備のネームプレートを外す',attendance:'本名つきの出席の記録を出す',code:'登録コードでログインする',logout:'ログアウトする',issueCode:'登録コードを出す',issueDevice:'受付の端末の登録コードを出す',addMember:'名簿に人を足す'};
var page=(location.pathname.split('/').pop()||'index.html');
var SRC={'index.html':'受付の画面','kanri.html':'運営の画面','my.html':'マイページ（登録）','yoyaku.html':'マイページ（予約）','login.html':'ログインの画面'}[page]||'受付の画面';
var who='';
function dev(){try{var m=JSON.parse(localStorage.getItem('yumeaka_uketsuke_v1')||'null');return m&&m.name?m.name+'（'+(m.no||m.device)+'）':''}catch(e){return ''}}
var F=window.fetch?window.fetch.bind(window):null;
function send(op,res,msg){try{var b=new URLSearchParams();b.set('src',SRC);b.set('who',who||((page==='index.html'||page==='kanri.html'||page==='')?dev():''));b.set('op',String(op).slice(0,50));b.set('res',res);b.set('msg',String(msg||'').slice(0,300));b.set('ua',(navigator.userAgent||'').slice(0,140));
if(navigator.sendBeacon){navigator.sendBeacon(LOG,b)}else if(F){F(LOG,{method:'POST',body:b,keepalive:true}).catch(function(){})}}catch(e){}}
if(F){window.fetch=function(u,o){var p=F(u,o);try{
if(typeof u==='string'&&u.indexOf('/webhook/yumeaka-yoyaku-')>0&&u!==LOG&&o&&o.body&&o.body.get){
var op=o.body.get('op')||'view',extra='';
if(!SKIP[op]){
if(op==='scan')extra=String(o.body.get('code')||'').replace(/^yumeaka:/,'').slice(0,20);
if(op==='tap'||op==='photo')extra=o.body.get('no')||'';
if(op==='reserve'||op==='cancel')extra=(o.body.get('day')||'')+(o.body.get('dropLectures')?'・講義の参加を取り消す了解あり':'');
if(op==='joinLecture'||op==='leaveLecture')extra=(o.body.get('lecture')||'')+(o.body.get('confirm')?'・時間を変える了解あり':'');
if(op==='stopDevice'||op==='removePhoto')extra=o.body.get('target')||'';
if(op==='editLecture'||op==='editDay'||op==='stopDay')extra=o.body.get('target')||'';if(op==='stopLecture')extra=o.body.get('target')||'';if(op==='addLecture')extra=(o.body.get('day')||'')+' '+String(o.body.get('title')||'').slice(0,20);if(op==='addDay')extra=o.body.get('date')||'';
if(op==='promote'||op==='demote')extra=(o.body.get('day')||'')+' '+(o.body.get('target')||'');if(op==='bindSpare'||op==='unbindSpare')extra=(o.body.get('spare')||'')+(o.body.get('target')?' → '+o.body.get('target'):'');if(op==='editNotice'||op==='dropNotice'||op==='issueCode')extra=o.body.get('target')||'';if(op==='addMember')extra=String(o.body.get('name')||'').slice(0,12)+'・'+(o.body.get('group')||'');
if(op==='photo'&&page!=='index.html')extra='';
var label=(NAMES[op]||op)+(extra?'（'+extra+'）':'');
p.then(function(x){return x.clone().json()}).then(function(r){
if(r&&r.me&&r.me.name&&r.me.no)who=r.me.name+'（'+r.me.no+'）';else if(r&&r.profile&&r.profile.name)who=r.profile.name+'（'+r.profile.no+'）';else if(r&&r.name&&r.no)who=r.name+'（'+r.no+'）';
var bad=(!r||r.ok===false||r.auth===false||r.cls==='ng');
send(label,(r&&r.confirm)?'確認中':(bad?'断った':'成功'),(r&&r.confirm&&r.confirm.message)||(r&&r.message)||'');
}).catch(function(e){send(label,'失敗','通信か、返事の読み取りに失敗：'+String((e&&e.message)||e))});
}}}catch(e){}
return p}}
window.addEventListener('error',function(e){send('画面の不具合','失敗',String(e.message||'')+' @'+String(e.filename||'').split('/').pop()+':'+(e.lineno||''))});
window.addEventListener('unhandledrejection',function(e){send('画面の不具合','失敗',String((e.reason&&e.reason.message)||e.reason||''))});
window.YumeLog=send;
})();
