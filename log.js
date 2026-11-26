/* 夢アカ 予約・受付：操作の記録（社内の試験用）。
   画面から受け口に送った操作と、その結果を、表の「操作ログ」に残す。
   鍵・専用リンク・写真・登録コードは送らない。 */
(function(){
var LOG='https://yasuulab-n8n.xvps.jp/webhook/yumeaka-yoyaku-log-7d31e4';
var SKIP={face:1,photos:1,roster:1,nextday:1};
var NAMES={open:'受付の画面を開く',scan:'QRを読み取る',tap:'名前から受け付ける',photo:'顔写真を保存する',register:'端末を登録する',forget:'端末の登録を消す',overview:'運営画面を開く',stopDevice:'端末を止める',removePhoto:'顔写真を消す',me:'自分の登録を開く',confirm:'登録の内容を確かめる',view:'予約のページを開く',reserve:'予約する',cancel:'予約を取り消す',reset:'環境をリセットする'};
var page=(location.pathname.split('/').pop()||'index.html');
var SRC={'index.html':'受付の画面','kanri.html':'運営の画面','my.html':'自分の登録','yoyaku.html':'予約のページ'}[page]||'受付の画面';
var who='';
function dev(){try{var m=JSON.parse(localStorage.getItem('yumeaka_uketsuke_v1')||'null');return m&&m.name?m.name+'（'+m.device+'）':''}catch(e){return ''}}
var F=window.fetch?window.fetch.bind(window):null;
function send(op,res,msg){try{var b=new URLSearchParams();b.set('src',SRC);b.set('who',who||dev());b.set('op',String(op).slice(0,50));b.set('res',res);b.set('msg',String(msg||'').slice(0,300));b.set('ua',(navigator.userAgent||'').slice(0,140));
if(navigator.sendBeacon){navigator.sendBeacon(LOG,b)}else if(F){F(LOG,{method:'POST',body:b,keepalive:true}).catch(function(){})}}catch(e){}}
if(F){window.fetch=function(u,o){var p=F(u,o);try{
if(typeof u==='string'&&u.indexOf('/webhook/yumeaka-yoyaku-')>0&&u!==LOG&&o&&o.body&&o.body.get){
var op=o.body.get('op')||'view',extra='';
if(!SKIP[op]){
if(op==='scan')extra=String(o.body.get('code')||'').replace(/^yumeaka:/,'').slice(0,20);
if(op==='tap'||op==='photo')extra=o.body.get('no')||'';
if(op==='reserve'||op==='cancel')extra=o.body.get('day')||'';
if(op==='stopDevice'||op==='removePhoto')extra=o.body.get('target')||'';
if(op==='photo'&&page!=='index.html')extra='';
var label=(NAMES[op]||op)+(extra?'（'+extra+'）':'');
p.then(function(x){return x.clone().json()}).then(function(r){
if(r&&r.profile&&r.profile.name)who=r.profile.name+'（'+r.profile.no+'）';else if(r&&r.name&&r.no)who=r.name+'（'+r.no+'）';
var bad=(!r||r.ok===false||r.auth===false||r.cls==='ng');
send(label,bad?'断った':'成功',(r&&r.message)||'');
}).catch(function(e){send(label,'失敗','通信か、返事の読み取りに失敗：'+String((e&&e.message)||e))});
}}}catch(e){}
return p}}
window.addEventListener('error',function(e){send('画面の不具合','失敗',String(e.message||'')+' @'+String(e.filename||'').split('/').pop()+':'+(e.lineno||''))});
window.addEventListener('unhandledrejection',function(e){send('画面の不具合','失敗',String((e.reason&&e.reason.message)||e.reason||''))});
window.YumeLog=send;
})();
