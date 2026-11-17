// @ts-nocheck
/* Data a pomocné funkce – převzato z prototypu (stav 17. 11. 2026) */

var S = {
  BL:['behejlesy.cz','https://behejlesy.cz/en/o-serialu'],
  BLN:['ČeskéNoviny 11/2026','https://www.ceskenoviny.cz/zpravy/2900634'],
  RC:['VisitCzechia – kalendář RunCzech 2027','https://www.visitczechia.com/de-de/news/2026/09/runczech-registration-start-2027'],
  GT:['gotrail.run','https://gotrail.run/trailove-behy/cesko/liberecky-kraj'],
  GT2:['gotrail.run','https://gotrail.run/trailove-behy/cesko/liberecky-kraj?page=2'],
  GTJ:['gotrail.run','https://gotrail.run/cs/akce/jested-skyrace'],
  FIN:['finishers.com','https://www.finishers.com/cs/e/leki-jested-skyrace'],
  JS:['jestedskyrace.cz','https://jestedskyrace.cz'],
  SN:['stopnito.cz','https://www.stopnito.cz/zavody']
};
function cbDetail(slug){return 'https://ceskybeh.cz/zavody/'+slug+'/';}
function cbRes(slug){return 'https://ceskybeh.cz/vysledky/'+slug+'/';}
var L = {
  BL:{reg:['behejlesy.cz','https://behejlesy.cz'],res:['behejlesy.cz','https://behejlesy.cz']},
  RC:{reg:['runczech.com','https://www.runczech.com'],res:['runczech.com','https://www.runczech.com']},
  SN:{reg:['stopnito.cz','https://www.stopnito.cz/zavody'],start:['stopnito.cz','https://www.stopnito.cz/zavody'],res:['stopnito.cz','https://www.stopnito.cz/vysledky-zavodu']}
};
var W = {BL:'https://behejlesy.cz',RC:'https://www.runczech.com',JS:'https://jestedskyrace.cz'};
function R(o){o.tracks=o.tracks||[];o.flags=o.flags||[];o.to=o.to||null;o.series=o.series||'';o.start=o.start||null;o.kids=!!o.kids;o.tracksYear=o.tracksYear||2027;o.links=o.links||{};o.plat=o.plat||[];o.venue=o.venue||'';o.fee=o.fee||'';return o;}
var RACES = [
  R({id:'js-winter-skyrace',name:'LEKI Winter SkyRace Ještěd',series:'Ještěd SkyRace',from:'2026-12-05',place:'Ještěd',region:'Liberecký',lat:50.735,lon:15.005,surface:'trail',tracks:[[6,null],[12,null],[22,null]],kids:true,flags:['se psem (canicross)'],status:'oficialni',plat:['sn','gt'],links:L.SN,src:[S.SN,S.GT,S.JS],web:W.JS}),
  R({id:'js-winter-weekend',name:'LEKI Ještěd 24 Winter + 10K/21K/42K',series:'Ještěd SkyRace',from:'2027-01-16',to:'2027-01-17',place:'Ještěd',region:'Liberecký',lat:50.735,lon:15.005,surface:'trail',tracks:[[10,null],[21.1,null],[42.2,null]],kids:true,flags:['24h závod','štafety'],status:'oficialni',plat:['sn','gt'],links:L.SN,src:[S.SN,S.GT,S.JS],web:W.JS}),
  R({id:'sn-bezrucak',name:'Desítka v Bezručáku (51. ročník)',from:'2027-01-09',place:'Chomutov',region:'Ústecký',lat:50.460,lon:13.418,surface:'neuvedeno',tracks:[[10,null]],status:'oficialni',plat:['sn'],links:L.SN,src:[S.SN],web:S.SN[1],note:'Délka odvozena z názvu'}),
  R({id:'rc-valentyn',name:'Valentýnský běh 7 km',series:'RunCzech',from:'2027-02-13',place:'Praha',region:'Praha',lat:50.087,lon:14.421,surface:'silnice',tracks:[[7,null]],status:'oficialni',plat:['rc'],links:L.RC,src:[S.RC],web:W.RC}),
  R({id:'bl-sarka',name:'Běhej lesy Divoká Šárka',series:'Běhej lesy',from:'2027-03-19',to:'2027-03-20',place:'Praha – Divoká Šárka',region:'Praha',lat:50.095,lon:14.320,surface:'trail',tracks:[],kids:true,flags:['štafety 4×5 km'],status:'oficialni',plat:['bl'],links:L.BL,src:[S.BL,S.BLN],web:W.BL,note:'Nová lokalita – délky individuálních tratí zatím nezveřejněny'}),
  R({id:'rc-pulmaraton',name:'Pražský půlmaraton',series:'RunCzech',from:'2027-04-03',place:'Praha',region:'Praha',lat:50.087,lon:14.421,surface:'silnice',tracks:[[21.1,null]],status:'oficialni',plat:['rc'],links:L.RC,src:[S.RC],web:W.RC}),
  R({id:'sn-7p-jizerky',name:'7 Pohoří – Jizerské hory',series:'7 Pohoří',from:'2027-04-10',place:'Hrabětice',region:'Liberecký',lat:50.800,lon:15.250,surface:'trail',tracks:[[6,null],[14,null],[25,null]],status:'oficialni',plat:['sn','gt'],links:L.SN,src:[S.SN,S.GT],web:S.SN[1],note:'Na gotrail.run jako „Závod Jizerské hory“ – sloučeno'}),
  R({id:'js-skyrace',name:'LEKI Ještěd SkyRace',series:'Ještěd SkyRace',from:'2027-04-17',place:'Ještěd – areál skokanských můstků',region:'Liberecký',lat:50.735,lon:15.005,surface:'trail',tracks:[[6,300],[13,945],[22,1390]],kids:true,flags:['se psem (canicross)'],status:'oficialni',plat:['sn','gt'],links:L.SN,src:[S.SN,S.GTJ,S.FIN,S.JS],web:W.JS,note:'Kvalifikace na ME v trailu'}),
  R({id:'bl-karlstejn',name:'Běhej lesy Karlštejn',series:'Běhej lesy',from:'2027-04-17',place:'Karlštejn',region:'Středočeský',lat:49.934,lon:14.188,surface:'trail',tracks:[[6,null],[12,null],[18,null],[30,null]],tracksYear:2026,kids:true,status:'oficialni',plat:['bl'],links:L.BL,src:[S.BL,S.BLN],web:W.BL}),
  R({id:'gt-brniste',name:'SHELMA Brnišťský půlmaraton',from:'2027-04-24',place:'Brniště',region:'Liberecký',lat:50.730,lon:14.700,surface:'trail',tracks:[[3,null],[11,null],[21.1,null]],status:'agregator',plat:['gt'],src:[S.GT],web:S.GT[1]}),
  R({id:'gt-hrubaskala',name:'Hruboskalský půlmaraton',from:'2027-04-24',place:'Hrubá Skála',region:'Liberecký',lat:50.545,lon:15.190,surface:'trail',tracks:[[13,null],[21.1,null]],status:'agregator',plat:['gt'],src:[S.GT],web:S.GT[1]}),
  R({id:'sn-mutraverz',name:'MUTRAVERZ',from:'2027-04-24',place:'Mikulov',region:'Jihomoravský',lat:48.806,lon:16.638,surface:'neuvedeno',tracks:[],status:'oficialni',plat:['sn'],links:L.SN,src:[S.SN],web:S.SN[1],note:'Tratě doplníme z detailu na stopnito.cz'}),
  R({id:'rc-maraton',name:'Pražský maraton',series:'RunCzech',from:'2027-05-02',place:'Praha',region:'Praha',lat:50.087,lon:14.421,surface:'silnice',tracks:[[42.2,null]],status:'oficialni',plat:['rc'],links:L.RC,src:[S.RC],web:W.RC,note:'Maratonský víkend 1.–2. 5.'}),
  R({id:'rc-mrf-kv',name:'Mattoni Running Festival Karlovy Vary',series:'RunCzech',from:'2027-05-15',place:'Karlovy Vary',region:'Karlovarský',lat:50.231,lon:12.871,surface:'silnice',tracks:[[21.1,null]],kids:true,status:'oficialni',plat:['rc'],links:L.RC,src:[S.RC],web:W.RC,note:'+ kratší tratě a rodinné běhy'}),
  R({id:'gt-250-cesky-raj',name:'250 Český ráj',from:'2027-05-21',to:'2027-05-22',place:'Sedmihorky',region:'Liberecký',lat:50.560,lon:15.170,surface:'trail',tracks:[[250,null]],status:'agregator',plat:['gt'],src:[S.GT],web:S.GT[1]}),
  R({id:'sn-tahoun-jaro',name:'Jablonecký tahoun vol. 2 – Jarní pohon',from:'2027-05-22',place:'Maršovice – hřiště TJ Sokol',region:'Liberecký',lat:50.720,lon:15.200,surface:'trail',tracks:[[3,null],[5,null],[8,null]],flags:['se psem (canicross)'],status:'oficialni',plat:['sn','gt'],links:L.SN,src:[S.SN,S.GT],web:S.SN[1]}),
  R({id:'bl-brdy',name:'Běhej lesy Brdy',series:'Běhej lesy',from:'2027-05-22',place:'Brdy',region:'Středočeský',lat:49.750,lon:13.930,surface:'trail',tracks:[[5,null],[12,null],[22,null]],tracksYear:2026,kids:true,status:'oficialni',plat:['bl'],links:L.BL,src:[S.BL,S.BLN],web:W.BL,note:'Pro 2027 ohlášena nová extra dlouhá trať'}),
  R({id:'rc-mrf-cb',name:'Mattoni Running Festival České Budějovice',series:'RunCzech',from:'2027-05-29',place:'České Budějovice',region:'Jihočeský',lat:48.975,lon:14.474,surface:'silnice',tracks:[[21.1,null]],kids:true,status:'oficialni',plat:['rc'],links:L.RC,src:[S.RC],web:W.RC,note:'+ kratší tratě a rodinné běhy'}),
  R({id:'gt-certovsky-ultra',name:'Čertovskej ultratrail',from:'2027-06-05',place:'Hamr na Jezeře',region:'Liberecký',lat:50.700,lon:14.840,surface:'trail',tracks:[[33.3,null],[66.6,null]],status:'agregator',plat:['gt'],src:[S.GT],web:S.GT[1]}),
  R({id:'gt-hejnice-peklo',name:'Z Hejnic do Pekla',from:'2027-06-05',place:'Hejnice',region:'Liberecký',lat:50.877,lon:15.180,surface:'trail',tracks:[[5,null],[10,null],[21.1,null]],status:'agregator',plat:['gt'],src:[S.GT],web:S.GT[1]}),
  R({id:'sn-yellow-ribbon',name:'Yellow Ribbon Run',from:'2027-06-10',place:'Praha 6 – Obora Hvězda',region:'Praha',lat:50.083,lon:14.330,surface:'neuvedeno',tracks:[],status:'oficialni',plat:['sn'],links:L.SN,src:[S.SN],web:S.SN[1],note:'Tratě doplníme z detailu na stopnito.cz'}),
  R({id:'rc-mrf-olomouc',name:'Mattoni Running Festival Olomouc',series:'RunCzech',from:'2027-06-12',place:'Olomouc',region:'Olomoucký',lat:49.594,lon:17.251,surface:'silnice',tracks:[[21.1,null]],kids:true,status:'oficialni',plat:['rc'],links:L.RC,src:[S.RC],web:W.RC,note:'+ kratší tratě a rodinné běhy'}),
  R({id:'js-summer-weekend',name:'LEKI Ještěd 24 Summer + 10K/21K/42K',series:'Ještěd SkyRace',from:'2027-06-12',to:'2027-06-13',place:'Ještěd',region:'Liberecký',lat:50.735,lon:15.005,surface:'trail',tracks:[[10,null],[21.1,null],[42.2,null]],kids:true,flags:['24h závod','štafety'],status:'oficialni',plat:['sn','gt'],links:L.SN,src:[S.SN,S.GT,S.JS],web:W.JS}),
  R({id:'rc-relay',name:'UniCredit Prague Relay',series:'RunCzech',from:'2027-06-22',to:'2027-06-24',place:'Praha',region:'Praha',lat:50.087,lon:14.421,surface:'silnice',tracks:[],flags:['štafety'],status:'oficialni',plat:['rc'],links:L.RC,src:[S.RC],web:W.RC,note:'Délky úseků doplníme z propozic'}),
  R({id:'gt-olymp-turnov',name:'Olympijský běh – Turnov',from:'2027-06-23',place:'Turnov',region:'Liberecký',lat:50.587,lon:15.157,surface:'trail',tracks:[[6,null]],status:'agregator',plat:['gt'],src:[S.GT2],web:S.GT2[1]}),
  R({id:'gt-olymp-bedrichov',name:'Olympijský běh – Bedřichov',from:'2027-06-23',place:'Bedřichov',region:'Liberecký',lat:50.790,lon:15.140,surface:'trail',tracks:[[5,null]],status:'agregator',plat:['gt'],src:[S.GT2],web:S.GT2[1]}),
  R({id:'bl-tymovka',name:'Běhej lesy Týmovka',series:'Běhej lesy',from:'2027-06-25',to:'2027-06-27',place:'Nové Město na Moravě – Vysočina Arena',region:'Vysočina',lat:49.565,lon:16.072,surface:'trail',tracks:[[6,null],[13,null],[21,null]],tracksYear:2026,kids:true,flags:['štafety 27,5 km'],status:'oficialni',plat:['bl'],links:L.BL,src:[S.BL,S.BLN],web:W.BL}),
  R({id:'bl-klinovec',name:'Běhej lesy Klínovec',series:'Běhej lesy',from:'2027-07-10',place:'Klínovec',region:'Karlovarský',lat:50.396,lon:12.968,surface:'trail',tracks:[[6,null],[11,null],[23,null]],tracksYear:2026,kids:true,status:'oficialni',plat:['bl'],links:L.BL,src:[S.BL,S.BLN],web:W.BL}),
  R({id:'bl-bila',name:'Běhej lesy Bílá',series:'Běhej lesy',from:'2027-07-31',place:'Bílá (Beskydy)',region:'Moravskoslezský',lat:49.444,lon:18.457,surface:'trail',tracks:[[5,null],[11,null],[20,null]],tracksYear:2026,kids:true,status:'oficialni',plat:['bl'],links:L.BL,src:[S.BL,S.BLN],web:W.BL}),
  R({id:'bl-jizerska',name:'Běhej lesy Jizerská',series:'Běhej lesy',from:'2027-08-28',place:'Bedřichov',region:'Liberecký',lat:50.790,lon:15.140,surface:'trail',tracks:[[5,null],[11,null],[23,null],[50,null]],tracksYear:2026,kids:true,status:'oficialni',plat:['bl','gt'],links:L.BL,src:[S.BL,S.BLN,S.GT2],web:W.BL}),
  R({id:'rc-birell',name:'Birell Grand Prix Praha',series:'RunCzech',from:'2027-09-04',place:'Praha',region:'Praha',lat:50.087,lon:14.421,surface:'silnice',tracks:[[10,null]],status:'oficialni',plat:['rc'],links:L.RC,src:[S.RC],web:W.RC}),
  R({id:'sn-7p-krkonose',name:'7 Pohoří – Krkonoše',series:'7 Pohoří',from:'2027-09-11',place:'Benecko',region:'Liberecký',lat:50.665,lon:15.550,surface:'trail',tracks:[[7,null],[13,null],[20,null]],status:'oficialni',plat:['sn','gt'],links:L.SN,src:[S.SN,S.GT2],web:S.SN[1],note:'Na gotrail.run jako „Závod Krkonoše“ – sloučeno'}),
  R({id:'gt-bezdez',name:'Bezdězský půlmaraton',from:'2027-09-11',place:'Doksy',region:'Liberecký',lat:50.565,lon:14.655,surface:'trail',tracks:[[13,null],[21.1,null]],status:'agregator',plat:['gt'],src:[S.GT2],web:S.GT2[1]}),
  R({id:'sn-tahoun-podzim',name:'Jablonecký tahoun vol. 3 – Podzimní pohon',from:'2027-09-18',place:'Maršovice – hřiště TJ Sokol',region:'Liberecký',lat:50.720,lon:15.200,surface:'trail',tracks:[],flags:['se psem (canicross)'],status:'oficialni',plat:['sn'],links:L.SN,src:[S.SN],web:S.SN[1]}),
  R({id:'rc-mrf-usti',name:'Mattoni Running Festival Ústí nad Labem',series:'RunCzech',from:'2027-09-18',place:'Ústí nad Labem',region:'Ústecký',lat:50.661,lon:14.032,surface:'silnice',tracks:[[21.1,null]],kids:true,status:'oficialni',plat:['rc'],links:L.RC,src:[S.RC],web:W.RC,note:'+ kratší tratě a rodinné běhy'}),
  R({id:'bl-zelezna-ruda',name:'Běhej lesy Železná Ruda',series:'Běhej lesy',from:'2027-09-18',place:'Železná Ruda',region:'Plzeňský',lat:49.137,lon:13.235,surface:'trail',tracks:[[5,null],[13,null],[18,null]],tracksYear:2026,kids:true,status:'oficialni',plat:['bl'],links:L.BL,src:[S.BL,S.BLN],web:W.BL}),
  R({id:'gt-jilemnicka-10',name:'Jilemnická 10',from:'2027-09-28',place:'Jilemnice',region:'Liberecký',lat:50.609,lon:15.507,surface:'trail',tracks:[[5,null],[10,null]],status:'agregator',plat:['gt'],src:[S.GT2],web:S.GT2[1],note:'Povrch převzat z trailového webu – ověřit'}),
  R({id:'rc-liberec-nature',name:'Mattoni Liberec Nature Run',series:'RunCzech',from:'2027-10-02',place:'Liberec',region:'Liberecký',lat:50.767,lon:15.056,surface:'trail',tracks:[[12,null],[22,null]],status:'oficialni',plat:['rc','gt'],links:L.RC,src:[S.RC,S.GT2],web:W.RC,note:'Na gotrail.run jako „Liberec Trail Run“ – sloučeno'}),
  R({id:'gt-hut-bratrikov',name:'Huť – Bratříkov – Huť',from:'2027-10-03',place:'Huť',region:'Liberecký',lat:50.700,lon:15.240,surface:'trail',tracks:[[5,null],[10,null]],status:'agregator',plat:['gt'],src:[S.GT2],web:S.GT2[1]}),
  R({id:'bl-lednice',name:'Běhej lesy Lednice',series:'Běhej lesy',from:'2027-10-09',place:'Lednice',region:'Jihomoravský',lat:48.800,lon:16.800,surface:'trail',tracks:[[7,null],[14,null],[22,null],[45,null]],tracksYear:2026,kids:true,status:'oficialni',plat:['bl'],links:L.BL,src:[S.BL,S.BLN],web:W.BL})
];

/* Termínovka ČAS (ceskybeh.cz), stav 17. 11. 2026: datum|název|místo|kraj|tratě km|povrch|start|slug|lat|lon|příznaky (k = dětské, s = štafety) */
var CB = `2026-11-21|Kružská Kundratická – Memoriál Honzy Šíra|Kruh|Liberecký|11/5/2|silnice|14:00|kruzska-kundraticka-memorial-honzy-sira-2026|50.618|15.485|k
2026-11-21|Trail do Háje VAŠÍ LIGY|Praha-Hlubočepy|Praha|14/9|trail|13:00|trail-do-haje-vasi-ligy-2026-2026|50.040|14.390|
2026-11-21|Přáslavická desítka|Přáslavice|Olomoucký|10|silnice|11:00|praslavicka-desitka-2026|49.590|17.390|
2026-11-21|Běh na Čáp|Teplice nad Metují|Královéhradecký|5.8|vrch|10:00|beh-na-cap-2026|50.594|16.170|
2026-11-21|Forestovo Nočník|Záluží u Plzně|Plzeňský|6|trail|18:00|forestovo-nocnik-2026|49.770|13.330|
2026-11-21|Slánské běhy|Slaný|Středočeský|12|smiseny|10:00|slanske-behy-2026|50.230|14.087|
2026-11-21|Čertovskej wintertrail|Hamr na Jezeře|Liberecký|33.3/16.6|trail|10:00|certovskej-wintertrail-2026|50.700|14.840|
2026-11-21|Vranov Trail|Vranov u Brna|Jihomoravský|21.1|trail|11:00|vranov-trail-2026|49.310|16.610|
2026-11-21|GP vytrvalců Kamenného Újezda|Kamenný Újezd|Jihočeský|6.5|smiseny||gp-vytrvalcu-kamenneho-ujezda-1-2026|48.900|14.450|
2026-11-22|405. Malá cena Monaka|Slatiňany|Pardubický|10/3.6|trail|10:30|405-mala-cena-monaka-2026|49.920|15.810|
2026-11-28|5 a 10 km VAŠÍ LIGY – listopadový|Praha 4-Braník|Praha|10/5|silnice|11:00|5-a-10-km-vasi-ligy-2026-12-listopadovy-2026|50.030|14.410|
2026-11-28|Mikulášský běh Zlín|Zlín-Louky|Zlínský|10/5|smiseny|10:00|mikulassky-beh-zlin-2026|49.190|17.620|
2026-11-28|Výběh na Lovoš|Lovosice|Ústecký|3|vrch|14:00|vybeh-na-lovos-2026|50.515|14.050|
2026-11-28|Stupenská sedmička|Stupno|Plzeňský|7|trail|10:00|stupenska-sedmicka-2026|49.770|13.620|
2026-11-28|Běh na Mohylu míru|Slavkov u Brna|Jihomoravský|25/10|trail|11:00|beh-na-mohylu-miru-2026|49.153|16.876|
2026-11-29|Podzimní běh lyžařů – memoriál Ály Syrovatského|Senohraby|Středočeský|8|trail|9:00|podzimni-beh-lyzaru-memorial-aly-syrovatskeho-2026|49.897|14.718|
2026-12-05|Mikulášský běh Čimelice|Čimelice|Jihočeský|8.8/4.4|trail|9:30|mikulassky-beh-2026|49.466|14.069|
2026-12-05|Veleslavín běží|Praha 6-Veleslavín|Praha|7|smiseny|11:00|veleslavin-bezi-2026|50.098|14.350|
2026-12-06|2 míle s úsměvem Olomouc – prosinec|Olomouc|Olomoucký|3.2|silnice|10:10|2-mile-s-usmevem-olomouc-prosinec-2026|49.594|17.251|
2026-12-06|Malá cena Velké Verandy|Choceň|Pardubický|4.3|trail|10:15|mala-cena-velke-verandy-2026|49.997|16.223|
2026-12-06|Zbraslavský běh|Praha 5-Zbraslav|Praha|5|trail|11:00|zbraslavsky-beh-2026|49.973|14.393|
2026-12-07|Běžecká série Berounka – Nižbor|Nižbor|Středočeský|9.5|trail|18:00|bezecka-serie-berounka-nizbor-2026|49.999|14.003|
2026-12-12|Winter Milada Run|Chabařovice|Ústecký|12.5/5.3|trail|12:00|winter-milada-run-2026|50.673|13.942|
2026-12-12|Mikulášský běh Úpice|Úpice|Královéhradecký|6|silnice|14:00|mikulassky-beh-upice-2026|50.512|16.016|
2026-12-12|Zručský adventní běh|Zruč nad Sázavou|Středočeský|5.5|smiseny|17:00|zrucsky-adventni-beh-2026|49.740|15.106|
2026-12-12|Mikulášský běh Petřkovice|Petřkovice u Starého Jičína|Moravskoslezský||smiseny||mikulassky-beh-petrkovice-2026|49.575|17.950|
2026-12-12|Předvánoční běh|Frýdek-Místek|Moravskoslezský|8/3|silnice|9:30|predvanocni-beh-2026|49.683|18.350|
2026-12-12|Christmas Run Praha|Praha 1|Praha|5/2/1|silnice|16:00|christmas-run-praha-2026|50.087|14.421|
2026-12-12|Vranovský noční Trail|Vranov u Brna|Jihomoravský|12|trail|16:00|vranovsky-nocni-trail-2026|49.310|16.610|
2026-12-13|Adventní běh na cyklostezce|Ústí nad Labem-Střekov|Ústecký|8.4/4.2|silnice|9:15|adventni-beh-na-cyklostezce-2026|50.650|14.060|
2026-12-13|Christmas Run Most|Most|Ústecký|5/2/1|smiseny|16:00|christmas-run-most-2026|50.503|13.636|
2026-12-13|Běh cyklistů|Praha 5-Jinonice|Praha|6/3|trail|10:30|beh-cyklistu-2026|50.054|14.370|
2026-12-19|Běh pod Pálavou|Perná|Jihomoravský|9.8|smiseny|10:20|beh-pod-palavou-2026|48.850|16.620|
2026-12-20|Vánoční běh Opava|Opava|Moravskoslezský|3.8|silnice|10:00|vanocni-beh-opava-2026|49.938|17.902|
2026-12-20|406. Malá cena Monaka – Vánoční|Slatiňany|Pardubický|10/3.6|trail|10:30|406-mala-cena-monaka-vanocni-2026|49.920|15.810|
2026-12-24|Vánoční běh v Ďáblickém háji|Praha 8-Ďáblice|Praha|4.5|trail|10:00|vanocni-beh-v-dablickem-haji-2026|50.140|14.480|
2026-12-25|Vánoční běh Elektrokov Znojmo|Znojmo|Jihomoravský|10.58/5|silnice|9:15|vanocni-beh-elektrokov-znojmo-2026|48.856|16.049|
2026-12-26|Štěpánský běh Prachatice|Prachatice|Jihočeský|10|silnice||stepansky-beh-2026|49.013|13.997|
2026-12-26|Štěpánský kros pro děti a Lidový běh|Svitavy|Pardubický|4.2/2.1|trail|10:00|stepansky-kros-pro-deti-vsech-kategorii-a-lidovy-beh-2026|49.756|16.469|k
2026-12-26|Štěpánský běh Zlín|Zlín-Příluky|Zlínský|10/3.3|silnice|10:00|stepansky-beh-zlin-2026|49.210|17.700|
2026-12-26|Vánoční běh Třtice|Třtice|Středočeský|4.6|smiseny|10:30|vanocni-beh-trtice-2026|50.185|13.860|
2026-12-27|(Před)Silvestrovský běh Lysá nad Labem|Lysá nad Labem|Středočeský|6.2/3.1|silnice|10:15|pred-silvestrovsky-beh-lysa-nad-labem-2026|50.201|14.833|
2026-12-30|Silvestrovský běh ulicemi města Soběslavi|Soběslav|Jihočeský|2.026|silnice|21:00|silvestrovsky-beh-ulicemi-mesta-sobeslavi-2026|49.260|14.719|
2026-12-31|Silvestrovský běh Jistebnice|Jistebnice|Jihočeský|14.2|silnice|10:00|silvestrovsky-beh-jistebnice-2026|49.486|14.528|
2026-12-31|Silvestrovský běh Hrabovou|Ostrava-Hrabová|Moravskoslezský|9.2/4.7|silnice|10:00|silvestrovsky-beh-hrabovou-2026|49.780|18.260|s
2026-12-31|Silvestrovský běh okolo 3 přehrad|Jablonec nad Nisou|Liberecký|5|smiseny|11:00|silvestrovsky-beh-okolo-3-prehrad-2026|50.724|15.171|
2026-12-31|Silvestrovský běh Karviná|Karviná|Moravskoslezský|10|silnice|10:00|silvestrovsky-beh-2026|49.854|18.543|
2026-12-31|Silvestrovský běh Havlovicemi|Havlovice|Královéhradecký|6.6|silnice|10:00|silvestrovsky-beh-havlovicemi-2026|50.470|16.000|
2026-12-31|Silvestrovský běh Zlín|Zlín|Zlínský|10/5|silnice|11:00|silvestrovsky-beh-zlin-2026|49.226|17.667|
2026-12-31|Silvestrovský běh Stříbro|Stříbro|Plzeňský|5|smiseny|10:00|silvestrovsky-beh-stribro-2026|49.753|12.997|
2026-12-31|Silvestrovský běh – memoriál Richarda Plcha|Brno-Nový Lískovec|Jihomoravský|9.8|smiseny|9:00|silvestrovsky-beh-memorial-richarda-plcha-2026|49.180|16.560|
2026-12-31|Silvestrovský běh Kolín|Kolín|Středočeský|3|smiseny|10:30|silvestrovsky-beh-kolin-2026|50.028|15.200|
2026-12-31|Půlnoční silvestrovsko-novoroční běh metropolí|Praha 13|Praha|4|silnice|23:50|pulnocni-silvestrovsko-novorocni-beh-metropoli-2026|50.050|14.330|
2026-12-31|Silvestrovský běh Přerov|Přerov|Olomoucký|7.5|silnice|10:00|silvestrovsky-beh-prerov-2026|49.455|17.451|
2026-12-31|Běh od Hasy k Hase|Roudnice nad Labem|Ústecký|5.2|smiseny|10:00|beh-od-hasy-k-hase-2026|50.425|14.260|
2026-12-31|Silvestrovský lázeňský běh|Poděbrady|Středočeský|5|smiseny|9:30|silvestrovsky-lazensky-beh-2026|50.142|15.119|
2027-01-09|Běh kolem Žabárny|Rtyně v Podkrkonoší|Královéhradecký|6|smiseny||beh-kolem-zabarny-2027|50.505|16.072|
2027-01-16|Zimní běh na Blaník|Načeradec|Středočeský|19.9/11.2|smiseny|10:10|zimni-beh-na-blanik-2027|49.610|14.906|
2027-01-16|Běh kolem Hořiček|Hořičky|Královéhradecký|6|smiseny|10:00|beh-kolem-horicek-2027|50.425|16.030|
2027-01-22|Freeport Night Run|Hatě u Znojma|Jihomoravský|6/3|jiny|19:00|freeport-night-run-2027|48.795|16.060|
2027-01-23|Běh po Bremstě|Malé Svatoňovice|Královéhradecký|7/5|smiseny|10:00|beh-po-bremste-2027|50.534|16.050|
2027-01-30|Běh Velbabou|Radeč|Královéhradecký|6|smiseny|10:00|beh-velbabou-2027|50.530|16.000|
2027-02-06|Běh po cyklostezce|Úpice|Královéhradecký|6|silnice|10:00|beh-po-cyklostezce-2027|50.512|16.016|
2027-02-13|Běh Kvíčalou|Úpice|Královéhradecký|6|smiseny|10:00|beh-kvicalou-2027|50.512|16.016|
2027-02-27|Winter TRAIL|Halenkovice|Zlínský|21.1/10/5/2|smiseny|10:00|winter-trail-2026-2027|49.170|17.470|s
2027-03-07|Úpická desítka|Úpice|Královéhradecký|10|silnice|12:30|upicka-desitka-2027|50.512|16.016|
2027-03-13|10 jarních kilometrů|Kunčina|Pardubický|10/3.8|silnice|13:30|10-jarnich-kilometru-2027|49.795|16.630|
2027-03-20|UNICONN CZ Noční desítka|Jihlava|Vysočina|10/5|silnice|18:00|uniconn-cz-nocni-desitka-2027|49.396|15.591|
2027-03-27|Veselská 21 – mezi pískovnami|Veselí nad Lužnicí|Jihočeský|21.1/10.5|trail|10:00|veselska-21-mezi-piskovnami-2027|49.184|14.697|
2027-04-10|Urban Challenge Praha Bohnice|Praha 8-Bohnice|Praha|10/5|OCR||urban-challenge-praha-bohnice-2027|50.132|14.415|
2027-04-24|Půlmaraton Plzeňského kraje|Plzeň|Plzeňský|21.1/9.59/5.85|silnice|10:00|pulmaraton-plzenskeho-kraje-2027|49.747|13.378|
2027-05-15|Městecká desítka a pětka|Městec Králové|Středočeský|10/5|silnice|9:30|mestecka-desitka-a-petka-2027|50.207|15.297|
2027-05-21|Urban Challenge Brno|Brno|Jihomoravský|10/5|OCR||urban-challenge-brno-2027|49.195|16.608|
2027-05-23|Vysocká pětka|Vysoká nad Labem|Královéhradecký|5|silnice|9:00|vysocka-petka-vzpominka-na-jirku-s-100-let-a-milana-2027|50.153|15.825|
2027-05-23|Běh městem Jarmily Kratochvílové|Golčův Jeníkov|Vysočina|15/5|silnice|10:00|beh-mestem-jarmily-kratochvilove-2027|49.816|15.477|
2027-06-11|Army Urban Challenge Žatec|Žatec|Ústecký|10/5|OCR||army-urban-challenge-zatec-2027|50.327|13.546|
2027-06-19|Revírní POHO běh|Karviná|Moravskoslezský|50/21/10/6|smiseny|8:00|revirni-poho-beh-2027|49.854|18.543|ks
2027-07-09|VUM Valašský ultramaraton|Krhová|Zlínský|43.3|smiseny|15:00|vum-valassky-ultramaraton-2027|49.483|17.990|
2027-09-03|Urban Challenge Praha Letňany|Praha 9-Letňany|Praha|10/5|OCR||urban-challenge-praha-letnany-2027|50.133|14.517|
2027-10-08|Běh pro Světlušku s knihovnou|Vsetín|Zlínský|10/2|smiseny|19:00|beh-pro-svetlusku-s-knihovnou-2027|49.339|17.996|`;
var EXTRA = {
  'kruzska-kundraticka-memorial-honzy-sira-2026':{venue:'sokolovna',fee:'zdarma do 15 let, od 16 let 50 Kč',web:'http://www.obeckruh.cz'},
  'silvestrovsky-beh-okolo-3-prehrad-2026':{venue:'areál pivovaru Volt',fee:'100–200 Kč',web:'http://www.silvestrovskybeh.cz/',reg:L.SN.reg,start:L.SN.start,plat:'sn'},
  'certovskej-wintertrail-2026':{plat:'gt',note:'gotrail.run uvádí 28. 11. a 17/33 km – rozpor, platí údaj pořadatele v termínovce ČAS'}
};
CB.split('\n').forEach(function(line){
  var f=line.split('|');var slug=f[7];var ex=EXTRA[slug]||{};
  var dists=f[4]?f[4].split('/').map(function(x){return parseFloat(x);}):[];
  var flags=[];if(f[10].indexOf('s')>=0)flags.push('štafety');
  var links={reg:ex.reg||null,start:ex.start||null,res:['Český běh – výsledky ročníků',cbRes(slug)]};
  var plat=['cb'];if(ex.plat)plat.push(ex.plat);
  var src=[['Český běh (termínovka ČAS)',cbDetail(slug)]];if(ex.plat==='sn')src.push(S.SN);if(ex.plat==='gt')src.push(S.GT);
  RACES.push(R({id:'cb-'+slug,name:f[1],from:f[0],place:f[2],region:f[3],lat:parseFloat(f[8]),lon:parseFloat(f[9]),surface:f[5],tracks:dists.map(function(d){return [d,null];}),start:f[6]||null,kids:f[10].indexOf('k')>=0,flags:flags,status:'oficialni',plat:plat,links:links,src:src,web:ex.web||cbDetail(slug),venue:ex.venue,fee:ex.fee,note:ex.note}));
});
RACES.forEach(function(r){
  var night=/no[čc]n/i.test(r.name)||(r.start&&parseInt(r.start,10)>=17);
  if(night&&r.flags.indexOf('noční')<0)r.flags.push('noční');
});

var HOME = {lat:50.587,lon:15.157};
var MON = ['led','úno','bře','dub','kvě','čvn','čvc','srp','zář','říj','lis','pro'];
var DOW = ['neděle','pondělí','úterý','středa','čtvrtek','pátek','sobota'];
var DISTS = [{id:'5',label:'5 km',lo:3,hi:7},{id:'10',label:'10 km',lo:8,hi:12},{id:'21',label:'Půlmaraton',lo:18,hi:25},{id:'42',label:'Maraton',lo:40,hi:45},{id:'ultra',label:'Ultra 45+',lo:45.01,hi:9999}];
var SURFS = [{id:'silnice',label:'Silnice'},{id:'trail',label:'Trail / kros'},{id:'smiseny',label:'Smíšený'},{id:'vrch',label:'Do vrchu'},{id:'OCR',label:'OCR'},{id:'jiny',label:'Jiný'},{id:'neuvedeno',label:'Neuvedeno'}];
var SURFLAB = {}; SURFS.forEach(function(x){SURFLAB[x.id]=x.label;});
var TERR = [{id:'vse',label:'Vše'},{id:'rovina',label:'Rovina'},{id:'zvlneny',label:'Zvlněný'},{id:'horsky',label:'Horský'}];
var FLAGS = [{id:'kids',label:'Dětské závody'},{id:'pes',label:'Se psem'},{id:'stafety',label:'Štafety'},{id:'nocni',label:'Noční'}];
var SERIES = ['RunCzech','Běhej lesy','Ještěd SkyRace','7 Pohoří'];
var PLATS = [{id:'cb',label:'Český běh (ČAS)'},{id:'sn',label:'stopnito.cz'},{id:'rc',label:'RunCzech'},{id:'bl',label:'Běhej lesy'},{id:'gt',label:'gotrail.run'}];
var STATUS = [{id:'oficialni',label:'Oficiální termín'},{id:'agregator',label:'Z agregátoru'}];
var RADII = [{id:25,label:'25 km'},{id:50,label:'50 km'},{id:100,label:'100 km'},{id:0,label:'Celá ČR'}];
var KRAJE = ['Praha','Středočeský','Jihočeský','Plzeňský','Karlovarský','Ústecký','Liberecký','Královéhradecký','Pardubický','Vysočina','Jihomoravský','Olomoucký','Zlínský','Moravskoslezský'];
var KMP = [{lo:'5',hi:'15',label:'5–15 km'},{lo:'15',hi:'30',label:'15–30 km'},{lo:'30',hi:'',label:'30+ km'}];
var TERRLAB = {rovina:'Rovina',zvlneny:'Zvlněný',horsky:'Horský'};
var PAGE = 25;

function regionLabel(k){return k==='Praha'?'Praha':(k==='Vysočina'?'kraj Vysočina':k+' kraj');}
function roadKm(r){var R0=6371,toR=Math.PI/180;var dLat=(r.lat-HOME.lat)*toR,dLon=(r.lon-HOME.lon)*toR;var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(HOME.lat*toR)*Math.cos(r.lat*toR)*Math.sin(dLon/2)*Math.sin(dLon/2);var d=2*R0*Math.asin(Math.sqrt(a))*1.3;return Math.round(d/5)*5;}
RACES.forEach(function(r){r.km=roadKm(r);});
function terrainOf(r){var m=-1;r.tracks.forEach(function(t){if(t[1]!==null){var v=t[1]/t[0];if(v>m)m=v;}});if(m<0)return '';return m<15?'rovina':(m<=35?'zvlneny':'horsky');}
function hasFlag(r,id){if(id==='kids')return r.kids;var j=r.flags.join(' ');if(id==='pes')return j.indexOf('psem')>=0;if(id==='stafety')return j.indexOf('štafet')>=0;if(id==='nocni')return j.indexOf('noční')>=0;return false;}
function fmtKm(v){return String(v).replace('.',',');}
function hasReg(r){return !!(r.links&&r.links.reg);}


export {RACES,HOME,MON,DOW,DISTS,SURFS,SURFLAB,TERR,FLAGS,SERIES,PLATS,STATUS,RADII,KRAJE,KMP,TERRLAB,PAGE,regionLabel,roadKm,terrainOf,hasFlag,fmtKm,hasReg};
