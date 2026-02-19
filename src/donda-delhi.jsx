import { useState, useEffect, useRef, useCallback } from "react";

// ─── API KEYS ─────────────────────────────────────────────────────────────────
const GOOGLE_API_KEY   = "AIzaSyAC5Wcs7YMaELnz9nWrmSxfc64-0lxTWl4";
const GOOGLE_CLIENT_ID = "1037503042769-49ukmiro6nm0fn8jh0ffr9bpi9pbf1ll.apps.googleusercontent.com";

// ─── CONFIRMED CONCERT DATA ───────────────────────────────────────────────────
const CONCERT = {
  artist:      "Ye (Kanye West)",
  name:        "YE LIVE IN INDIA",
  date:        "2026-03-29",
  dateDisplay: "Sunday, 29 March 2026",
  gatesOpen:   "17:00",
  showStart:   "20:00",
  showEnd:     "22:30",
  venue:       "Jawaharlal Nehru Stadium",
  venueFull:   "Jawaharlal Nehru Stadium, Bhishma Pitamah Marg, Pragati Vihar, New Delhi 110003",
  venueLat:    28.5827,
  venueLng:    77.2330,
  organisers:  "White Fox · Plush Entertainment · Wizcraft · Laqshya",
  ticketUrl:   "https://www.district.in/events/ye-live-in-india-2026-buy-tickets",
  ticketNote:  "Non-refundable · No re-entry · District by Zomato only",
  ageLimit:    "7+ (under 16 with guardian)",
  bagPolicy:   "Bags no larger than A4 sheet. Mandatory bag check at all gates.",
  prohibited:  "Professional cameras, outside food/drinks, large bags, weapons, laser pointers",
  insideFood:  "Food, non-alcoholic & alcoholic drinks available inside",
  metro:       { station: "JLN Stadium", line: "Violet Line", walkMins: 5 },
  tickets: [
    { tier: "General",  price: "₹6,000",  note: "Standing · outer sections" },
    { tier: "Gold",     price: "₹9,500",  note: "Better position · standing" },
    { tier: "Platinum", price: "₹15,000", note: "Premium close sections" },
    { tier: "VIP",      price: "₹25,000", note: "VIP zone · barrier access" },
    { tier: "Lounge",   price: "₹30,000", note: "Seated lounge · top tier" },
  ],
  setlist: ["Heartless","Gold Digger","Stronger","Runaway","Jesus Walks","Famous","All of the Lights","Can't Tell Me Nothing","Good Life","Flashing Lights","Power","Touch the Sky"],
};

// ─── AIRPORTS & STATIONS ─────────────────────────────────────────────────────
const AIRPORTS = [
  { label:"IGI — Terminal 1D (Domestic)", value:"IGI-T1", lat:28.6562, lng:77.0890, toHotelMins:50,
    transit:"No direct metro from T1 — take AC bus to Dwarka Sec 21, then Violet Line",
    cab:"Cab ₹350–500 to central Delhi (~45 min off-peak)" },
  { label:"IGI — Terminal 2/3 (Int'l + some domestic)", value:"IGI-T23", lat:28.5562, lng:77.0999, toHotelMins:45,
    transit:"Airport Express → New Delhi Stn (20 min, ₹60) → onward metro",
    cab:"Cab ₹400–600 to South Delhi (~40 min off-peak)" },
];

const STATIONS = [
  { label:"New Delhi (NDLS)", value:"NDLS", lat:28.6424, lng:77.2195, toHotelMins:25, metro:"Yellow/Red Line → Violet Line via Kashmere Gate" },
  { label:"Hazrat Nizamuddin (NZM)", value:"NZM", lat:28.5878, lng:77.2507, toHotelMins:10, metro:"Closest to venue — 5 min auto/cab to JLN Stadium" },
  { label:"Old Delhi (DLI)", value:"DLI", lat:28.6599, lng:77.2191, toHotelMins:35, metro:"Red Line → Yellow Line → Violet Line" },
  { label:"Anand Vihar (ANVT)", value:"ANVT", lat:28.6467, lng:77.3159, toHotelMins:40, metro:"Blue Line → Violet Line via Yamuna Bank" },
  { label:"Sarai Rohilla (DEE)", value:"DEE", lat:28.6680, lng:77.1620, toHotelMins:45, metro:"Green Line → Yellow Line → Violet Line" },
];

const TRANSPORT = {
  Metro:            { peakMins:40, cost:"₹30–60",   note:"JLN Stadium station (Violet Line) — 5 min walk to venue. Best option." },
  Cab:              { peakMins:65, cost:"₹250–600",  note:"Ola/Uber. Heavy surge expected. Drop at Bhishma Pitamah Marg side." },
  "Auto-Rickshaw":  { peakMins:70, cost:"₹80–200",  note:"Negotiate fare. Not ideal after 17:30 — major traffic buildup." },
  "Park + Metro":   { peakMins:60, cost:"₹100–300", note:"Drive to INA/Jor Bagh → Metro to venue. Smart combination." },
};

const DEPARTURE_POINTS = [
  { label:"IGI Airport — Terminal 1 (Domestic)", value:"dep-t1",   prepMins:150 },
  { label:"IGI Airport — Terminal 2/3 (Int'l)",  value:"dep-t23",  prepMins:210 },
  { label:"New Delhi Railway Station (NDLS)",     value:"dep-ndls", prepMins:60  },
  { label:"Hazrat Nizamuddin (NZM)",              value:"dep-nzm",  prepMins:60  },
  { label:"Old Delhi Station (DLI)",              value:"dep-dli",  prepMins:75  },
  { label:"Anand Vihar Terminal (ANVT)",          value:"dep-anvt", prepMins:75  },
  { label:"Bus / Other",                          value:"dep-other",prepMins:45  },
];

// ─── BUDGET ───────────────────────────────────────────────────────────────────
const BUDGET = {
  Low: {
    label:"Budget",
    total:"₹600–1,000",
    food:{ est:"₹100–200", spots:["Karim's Express (Nizamuddin)","Haldiram's on Lodhi Road","Street stalls near Pragati Maidan"] },
    transport:{ est:"₹60–120", note:"Metro both ways" },
    explore:{ est:"₹300–600/day", spots:["Paranthe Wali Gali","Dilli Haat (entry ₹30)","India Gate lawns (free)","Jama Masjid (free)"] },
    tips:"Eat before leaving hotel. Venue food is 3× street price. Top up metro card in advance.",
  },
  Mid: {
    label:"Mid-Range",
    total:"₹1,500–2,500",
    food:{ est:"₹300–600", spots:["Sagar Ratna (INA Market)","Punjab Grill (CP)","Venue food stalls (budget ₹300 inside)"] },
    transport:{ est:"₹400–700", note:"Cab to venue, Metro back" },
    explore:{ est:"₹800–1,500/day", spots:["Humayun's Tomb (₹40)","Khan Market cafés","Hauz Khas Village","Lodhi Garden"] },
    tips:"Book cab in advance — surge will be very high. Metro is faster than cab post-show.",
  },
  High: {
    label:"Premium",
    total:"₹4,000–8,000+",
    food:{ est:"₹800–2,000", spots:["The Lodhi Hotel (pre-book)","Indian Accent (pre-book)","VIP lounge inside venue"] },
    transport:{ est:"₹1,000–2,000", note:"Private cab both ways" },
    explore:{ est:"₹3,000–6,000/day", spots:["Taj Mahal day trip (Agra)","Fine dining at Bukhara/Indian Accent","Golf or spa day","Private heritage tour"] },
    tips:"Book restaurants well ahead — concert nights fill Lodhi Road restaurants fast.",
  },
};

// ─── DELHI SIGHTSEEING ────────────────────────────────────────────────────────
const DELHI_SPOTS = {
  "Old Delhi": {
    icon:"🕌", color:"#c8b89a",
    spots:[
      { name:"Jama Masjid", time:60, open:"07:00", entry:"Free (camera ₹300)", tip:"India's largest mosque. Cover up. Avoid prayer times.", maps:"Jama+Masjid+New+Delhi" },
      { name:"Chandni Chowk", time:90, open:"10:00", entry:"Free", tip:"Best 10am–1pm before crowds peak. Try kachori at Old Famous Jalebi Wala.", maps:"Chandni+Chowk+Delhi" },
      { name:"Paranthe Wali Gali", time:45, open:"09:00", entry:"Free", tip:"150-year-old breakfast lane. Go before noon.", maps:"Paranthe+Wali+Gali+Delhi" },
      { name:"Red Fort (Lal Qila)", time:90, open:"09:30", entry:"₹50 (Indian) / ₹600 (Foreign)", tip:"UNESCO site. Arrive early — gets crowded by 11am.", maps:"Red+Fort+Delhi" },
    ]
  },
  "Central Delhi": {
    icon:"🏛", color:"#a09070",
    spots:[
      { name:"India Gate", time:60, open:"24/7", entry:"Free", tip:"Best at sunrise or post 6pm. Sit on the lawns — very relaxing.", maps:"India+Gate+New+Delhi" },
      { name:"Connaught Place", time:90, open:"10:00", entry:"Free", tip:"Delhi's commercial heart. Coffee at Wenger's. Walk the circular blocks.", maps:"Connaught+Place+Delhi" },
      { name:"Jantar Mantar", time:45, open:"09:00", entry:"₹25 (Indian)", tip:"1724 astronomical observatory. Quick but fascinating.", maps:"Jantar+Mantar+Delhi" },
      { name:"National Museum", time:90, open:"10:00", entry:"₹20 (Indian)", tip:"5000 years of Indian history. AC inside — great in March heat.", maps:"National+Museum+New+Delhi" },
    ]
  },
  "South Delhi": {
    icon:"🌿", color:"#8a7060",
    spots:[
      { name:"Humayun's Tomb", time:90, open:"06:00", entry:"₹40 (Indian) / ₹600 (Foreign)", tip:"UNESCO. More peaceful than Taj. Near concert venue. Stunning morning light.", maps:"Humayun+Tomb+Delhi" },
      { name:"Lodhi Garden", time:60, open:"05:00", entry:"Free", tip:"Park with Mughal tombs inside. Very peaceful. Great for morning walk.", maps:"Lodhi+Garden+Delhi" },
      { name:"Dilli Haat (INA)", time:90, open:"10:30", entry:"₹30", tip:"Craft fair rotating across all Indian states. Best for gifts + street food.", maps:"Dilli+Haat+INA+Delhi" },
      { name:"Khan Market", time:60, open:"10:00", entry:"Free", tip:"Delhi's priciest market. Great cafes — Big Chill, The Piano Man.", maps:"Khan+Market+Delhi" },
      { name:"Nizamuddin Dargah", time:60, open:"05:00", entry:"Free", tip:"Sufi shrine. Thursday evening qawwali is unforgettable. Dress modestly.", maps:"Nizamuddin+Dargah+Delhi" },
    ]
  },
  "North/Other": {
    icon:"🏰", color:"#706050",
    spots:[
      { name:"Qutub Minar", time:90, open:"07:00", entry:"₹40 (Indian) / ₹600 (Foreign)", tip:"UNESCO. Tallest brick minaret. Go early to beat March heat.", maps:"Qutub+Minar+Delhi" },
      { name:"Hauz Khas Village", time:90, open:"11:00", entry:"Free", tip:"Medieval ruins + cafes + boutiques by a lake. Great for evening.", maps:"Hauz+Khas+Village+Delhi" },
      { name:"Akshardham Temple", time:150, open:"09:30", entry:"Free (exhibitions extra)", tip:"Spectacular temple. No phones allowed. Plan 2.5–3 hrs minimum.", maps:"Akshardham+Temple+Delhi" },
      { name:"Lotus Temple", time:45, open:"09:00", entry:"Free", tip:"Stunning Bahai temple shaped like a lotus. Silent meditation inside.", maps:"Lotus+Temple+Delhi" },
    ]
  },
};

// ─── DAY ITINERARY TEMPLATES ──────────────────────────────────────────────────
const DAY_TEMPLATES = {
  before_Low: {
    title:"Day Before Concert — Budget Delhi",
    theme:"Classic Old Delhi + India Gate on a shoestring",
    steps:[
      { time:"08:00", icon:"🌅", label:"BREAKFAST", note:"Paranthe Wali Gali — 150-year-old breakfast lane", sub:"₹80–150 · Old Delhi · Get there early" },
      { time:"09:30", icon:"🕌", label:"JAMA MASJID", note:"India's largest mosque — breathtaking courtyard", sub:"Free · Cover up · 45 min" },
      { time:"10:30", icon:"🛍", label:"CHANDNI CHOWK WALK", note:"Old Delhi's iconic market lane", sub:"Free · Street shopping, spice market, old havelis" },
      { time:"12:30", icon:"🚇", label:"METRO TO CENTRAL DELHI", note:"Yellow Line from Chandni Chowk → Rajiv Chowk", sub:"₹30 · 15 min" },
      { time:"13:00", icon:"🍽", label:"LUNCH AT HALDIRAM'S", note:"Connaught Place — reliable and affordable", sub:"₹150–250 per head" },
      { time:"14:30", icon:"🏛", label:"INDIA GATE", note:"Iconic war memorial + great lawns for resting", sub:"Free · Photos, street food, street corn" },
      { time:"16:30", icon:"🏨", label:"BACK TO HOTEL — REST", note:"Shower, charge everything, prep concert bag", sub:"Early night — concert is tomorrow" },
      { time:"19:30", icon:"🍽", label:"DINNER NEAR HOTEL", note:"Local dhaba or Karim's Express", sub:"₹150–300 · Don't overeat — early sleep" },
      { time:"22:00", icon:"😴", label:"SLEEP EARLY", note:"Concert day tomorrow — rest is key", sub:"Set alarm. Energy needed." },
    ]
  },
  before_Mid: {
    title:"Day Before Concert — Mid-Range Delhi",
    theme:"Culture, Mughal history + a great dinner",
    steps:[
      { time:"08:30", icon:"🌿", label:"LODHI GARDEN MORNING WALK", note:"Park with Mughal tombs — peaceful & photogenic", sub:"Free · 45 min · Great light for photos" },
      { time:"09:30", icon:"🏛", label:"HUMAYUN'S TOMB", note:"UNESCO World Heritage — near the concert venue!", sub:"₹40 Indian / ₹600 Foreign · 1.5 hrs" },
      { time:"11:30", icon:"🍽", label:"LUNCH — SAGAR RATNA (INA)", note:"South Indian classics, reliably good", sub:"₹300–500 per head" },
      { time:"13:00", icon:"🛍", label:"DILLI HAAT (INA MARKET)", note:"Indian craft fair — all states represented", sub:"Entry ₹30 · 1.5 hrs · Gifts + street food" },
      { time:"15:00", icon:"☕", label:"KHAN MARKET COFFEE", note:"Big Chill or The Piano Man Jazz Club", sub:"₹200–400 · Recharge before evening" },
      { time:"17:00", icon:"🏨", label:"HOTEL — REST + PREP", note:"Shower, pack concert bag, download ticket offline", sub:"Charge power bank, set alarm" },
      { time:"20:00", icon:"🍽", label:"DINNER — PUNJAB GRILL (CP)", note:"North Indian, generous portions, good ambiance", sub:"₹800–1,500 per head · Pre-book" },
      { time:"22:30", icon:"😴", label:"SLEEP", note:"Concert tomorrow — sleep by 11pm", sub:"Alarm set. Big day ahead." },
    ]
  },
  before_High: {
    title:"Day Before Concert — Premium Delhi",
    theme:"Luxury heritage day before the show",
    steps:[
      { time:"07:30", icon:"🌅", label:"HOTEL BREAKFAST", note:"Full hotel breakfast — fuel up properly", sub:"Set the tone for the trip" },
      { time:"09:00", icon:"🏛", label:"HUMAYUN'S TOMB (EARLY)", note:"Beat the crowds — stunning Mughal architecture", sub:"₹40 entry · 1.5 hrs · UNESCO World Heritage" },
      { time:"11:00", icon:"🎨", label:"LODHI ART DISTRICT WALK", note:"Delhi's open-air street art gallery + Lodhi Garden", sub:"Free · 1 hr · Mix of colonial + contemporary" },
      { time:"13:00", icon:"🍽", label:"LUNCH — INDIAN ACCENT", note:"India's most acclaimed restaurant — pre-book essential", sub:"₹4,000–6,000 per head · New Indian cuisine" },
      { time:"15:30", icon:"🛍", label:"KHAN MARKET SHOPPING", note:"Good Earth, Fabindia, premium boutiques", sub:"₹2,000–5,000 · Quality Indian design + art" },
      { time:"18:00", icon:"🏨", label:"HOTEL — SPA OR POOL", note:"Rest & recover — spa treatment if available", sub:"Be fresh for tomorrow" },
      { time:"20:30", icon:"🍽", label:"DINNER — THE LODHI HOTEL", note:"Outdoor terrace dining in South Delhi", sub:"₹3,000–5,000 per head · Pre-book" },
      { time:"23:00", icon:"😴", label:"SLEEP", note:"Concert day tomorrow — don't stay up late", sub:"Energy is everything." },
    ]
  },
  after_Low: {
    title:"Day After Concert — Budget Recovery Day",
    theme:"Slow morning + Old Delhi if you missed it",
    steps:[
      { time:"09:30", icon:"🌅", label:"SLOW MORNING", note:"Concert recovery — ease into the day", sub:"Hotel breakfast, coffee, replay last night in your head" },
      { time:"11:00", icon:"🕌", label:"JAMA MASJID + CHANDNI CHOWK", note:"If you missed it — do it today. Old Delhi is worth it.", sub:"Free · Rickshaw from metro ₹50" },
      { time:"13:00", icon:"🍽", label:"LUNCH — KARIM'S", note:"150-year-old iconic Mughlai restaurant near Jama Masjid", sub:"₹200–400 per head · Must-try" },
      { time:"15:00", icon:"🏛", label:"INDIA GATE LAWNS", note:"Walk, decompress, street food", sub:"Free · Great for a slow afternoon" },
      { time:"17:00", icon:"🛍", label:"CONNAUGHT PLACE", note:"Last minute shopping + Wenger's bakery", sub:"Budget ₹200–500" },
      { time:"19:00", icon:"🛫", label:"HEAD TO DEPARTURE POINT", note:"Airport / Railway Station", sub:"Allow transit time + pre-departure prep" },
    ]
  },
  after_Mid: {
    title:"Day After Concert — Full Monday Explore",
    theme:"Qutub Minar + Hauz Khas + great send-off",
    steps:[
      { time:"09:00", icon:"🌅", label:"HOTEL BREAKFAST + SLOW START", note:"You earned it — concert recovery morning", sub:"Don't rush. It's a Monday." },
      { time:"10:30", icon:"🏰", label:"QUTUB MINAR", note:"UNESCO — Delhi's most iconic tower. Go early before heat.", sub:"₹40 Indian / ₹600 Foreign · 1.5 hrs" },
      { time:"12:30", icon:"🌿", label:"HAUZ KHAS VILLAGE", note:"Medieval ruins + lake + cafes + boutiques", sub:"Lunch at Social Offline / Yeti — ₹400–700" },
      { time:"15:00", icon:"🛍", label:"LAJPAT NAGAR MARKET", note:"Delhi's best bargain market — clothes, gifts, fabric", sub:"₹500–2,000 · Bargain hard" },
      { time:"17:30", icon:"🏨", label:"HOTEL — PACK + CHECK OUT", note:"Shower, pack, settle hotel bill", sub:"Keep ID accessible" },
      { time:"19:30", icon:"🛫", label:"DEPART DELHI", note:"Head to airport or station", sub:"Book cab in advance — peak Monday evening traffic" },
    ]
  },
  after_High: {
    title:"Day After Concert — Premium Send-Off",
    theme:"Leisurely luxury day + iconic farewell dinner",
    steps:[
      { time:"09:30", icon:"🌅", label:"HOTEL BREAKFAST — LEISURELY", note:"Recover properly. No rush.", sub:"Good coffee, morning papers, soak it in" },
      { time:"11:00", icon:"🏛", label:"HUMAYUN'S TOMB OR AKSHARDHAM", note:"One last UNESCO experience before you leave", sub:"Humayun's: 1.5 hrs ₹40 · Akshardham: 3 hrs, no phones" },
      { time:"13:30", icon:"🍽", label:"LUNCH — BUKHARA (ITC MAURYA)", note:"Dal Bukhara — Bill Clinton's favourite — iconic", sub:"₹3,000–5,000 per head · Pre-book" },
      { time:"16:00", icon:"🛍", label:"SELECT CITYWALK OR GOOD EARTH", note:"Premium Indian decor, fashion, jewellery", sub:"Saket mall area · ₹3,000–10,000+" },
      { time:"18:30", icon:"🏨", label:"HOTEL — FINAL PACK + SPA", note:"Spa if time permits. Pack leisurely.", sub:"Arrange hotel airport transfer" },
      { time:"20:30", icon:"🛫", label:"DEPART — AIRPORT TRANSFER", note:"Hotel concierge cab or pre-booked transfer", sub:"Allow 3 hrs for international · 2 hrs domestic" },
    ]
  },
};

// ─── CHECKLIST ────────────────────────────────────────────────────────────────
const CHECKLIST = {
  packing:[
    "Govt. Photo ID — Aadhaar / Passport (mandatory at gate)",
    "Concert ticket QR code saved offline",
    "Power bank (10,000 mAh+) fully charged",
    "Earphones / ear protection",
    "Cash ₹500 min + UPI open & tested",
    "Sealed empty water bottle (outside drinks prohibited)",
    "Light jacket — March nights get cool",
    "Sealed snacks (venue food is expensive)",
    "Hand sanitizer + small towel",
    "Hotel key / keycard",
    "Emergency contact on lock screen",
    "Hotel address screenshot for return cab",
  ],
  merch:[
    "Set merch budget before entering (cash preferred)",
    "Extra cash — card machines fail in queues",
    "Tote bag to carry merch items",
    "Research merch designs online beforehand",
    "Head to merch booth at gate opening — 17:00",
    "Expect 30–45 min queue wait at merch",
    "Limited editions sell out in the first hour",
  ],
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const toMins   = t => { if(!t) return 0; const [h,m]=t.split(":").map(Number); return h*60+m; };
const fromMins = n => { const v=((n%1440)+1440)%1440; return `${String(Math.floor(v/60)).padStart(2,"0")}:${String(v%60).padStart(2,"0")}`; };
const addMins  = (t,m) => fromMins(toMins(t)+m);
const fmtTime  = t => { if(!t) return ""; const [h,m]=t.split(":").map(Number); return `${(h%12)||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`; };
const fmtDate  = ds => new Date(ds+"T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});
const dateAdd  = (ds,d) => { const dt=new Date(ds+"T12:00:00"); dt.setDate(dt.getDate()+d); return dt.toISOString().slice(0,10); };
const minsUntil= (ds,t) => Math.round((new Date(`${ds}T${t}:00`)-new Date())/60000);

// ─── GOOGLE MAPS ──────────────────────────────────────────────────────────────
let _gm=null;
function loadGMaps(){
  if(_gm) return _gm;
  _gm=new Promise((res,rej)=>{
    if(window.google?.maps){res(window.google.maps);return;}
    const cb=`__gm_${Date.now()}`;
    window[cb]=()=>res(window.google.maps);
    const s=document.createElement("script");
    s.src=`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places,geometry&callback=${cb}`;
    s.onerror=rej; document.head.appendChild(s);
  });
  return _gm;
}

function useAutocomplete(ref, onPick){
  const ac=useRef(null);
  useEffect(()=>{
    if(!ref.current) return;
    let alive=true;
    loadGMaps().then(maps=>{
      if(!alive||!ref.current) return;
      try{ac.current?.unbindAll();}catch{}
      ac.current=new maps.places.Autocomplete(ref.current,{
        componentRestrictions:{country:"in"},
        fields:["place_id","name","formatted_address","geometry"],
      });
      ac.current.addListener("place_changed",()=>{
        const p=ac.current.getPlace();
        if(p?.geometry) onPick({name:p.name,address:p.formatted_address,placeId:p.place_id,lat:p.geometry.location.lat(),lng:p.geometry.location.lng()});
      });
    }).catch(()=>{});
    return ()=>{alive=false;try{ac.current?.unbindAll();}catch{}};
  },[]);
}

async function getLiveETA(lat,lng,mode="DRIVING"){
  try{
    const maps=await loadGMaps();
    const dep=new Date(`${CONCERT.date}T15:00:00`);
    return new Promise(res=>{
      new maps.DistanceMatrixService().getDistanceMatrix({
        origins:[{lat,lng}],
        destinations:[{lat:CONCERT.venueLat,lng:CONCERT.venueLng}],
        travelMode:maps.TravelMode[mode],
        ...(mode==="DRIVING"?{drivingOptions:{departureTime:dep>new Date()?dep:new Date(),trafficModel:maps.TrafficModel.BEST_GUESS}}:{}),
      },(r,s)=>{
        if(s!=="OK"){res(null);return;}
        const el=r.rows[0]?.elements[0];
        if(el?.status!=="OK"){res(null);return;}
        res({mins:Math.round((el.duration_in_traffic?.value||el.duration?.value)/60),dist:el.distance?.text});
      });
    });
  }catch{return null;}
}

async function getNearby(lat,lng,type,radius=1200){
  try{
    const maps=await loadGMaps();
    return new Promise(res=>{
      new maps.places.PlacesService(document.createElement("div")).nearbySearch(
        {location:{lat,lng},radius,type},
        (results,status)=>{
          if(status===maps.places.PlacesServiceStatus.OK)
            res(results.slice(0,6).map(p=>({name:p.name,address:p.vicinity,rating:p.rating,placeId:p.place_id,open:p.opening_hours?.open_now})));
          else res([]);
        }
      );
    });
  }catch{return [];}
}

// ─── ITINERARY ENGINE ─────────────────────────────────────────────────────────
function buildConcertDay({arrType,arrTime,arrLoc,hotelWake,hotelPlace,transport,budget,etaMins}){
  const tr=TRANSPORT[transport]||TRANSPORT.Metro;
  const travel=etaMins?etaMins+8:tr.peakMins;
  const depMins=toMins(CONCERT.gatesOpen)-travel-45;
  const deptTime=fromMins(depMins);
  let steps=[];

  if(arrType==="flight"){
    const ap=AIRPORTS.find(a=>a.value===arrLoc);
    const land=toMins(arrTime),bags=land+30,city=bags+(ap?.toHotelMins||50),cin=city+15;
    const restEnd=Math.min(cin+90,depMins-100);
    steps=[
      {id:"land",time:arrTime,icon:"✈",label:"LAND AT IGI",note:ap?.label||"IGI Airport",sub:ap?.transit||"Follow exit signs",hl:false},
      {id:"bags",time:fromMins(bags),icon:"🧳",label:"COLLECT BAGS",note:"Allow 25–30 min. Pre-paid cab stand or Airport Express.",sub:ap?.cab||"",hl:false},
      {id:"transit",time:fromMins(city),icon:"🚗",label:"HEAD TO HOTEL",note:`~${ap?.toHotelMins||50} min to central Delhi`,sub:"",hl:false},
      {id:"cin",time:fromMins(cin),icon:"🏨",label:"CHECK IN",note:hotelPlace?.name||"Your hotel",sub:"Drop bags, freshen up, charge all devices",hl:false},
      ...(restEnd>cin+30?[{id:"rest",time:fromMins(restEnd),icon:"😴",label:"REST ENDS — WAKE UP",note:"Set alarm — you need energy tonight",sub:"",hl:false}]:[]),
    ];
  } else if(arrType==="train"){
    const st=STATIONS.find(s=>s.value===arrLoc);
    const arr=toMins(arrTime),city=arr+(st?.toHotelMins||25),cin=city+10;
    steps=[
      {id:"train",time:arrTime,icon:"🚂",label:"TRAIN ARRIVES",note:st?.label||"Delhi station",sub:st?.metro||"",hl:false},
      {id:"transit",time:fromMins(city),icon:"🚇",label:"TRANSIT TO HOTEL",note:st?.metro||"Metro recommended",sub:`~${st?.toHotelMins||25} min`,hl:false},
      {id:"cin",time:fromMins(cin),icon:"🏨",label:"CHECK IN",note:hotelPlace?.name||"Your hotel",sub:"Drop bags, freshen up",hl:false},
    ];
  } else {
    steps=[{id:"wake",time:hotelWake||"09:00",icon:"🌅",label:"WAKE UP",note:hotelPlace?.name||"Hotel",sub:"Shower, hydrate, proper breakfast",hl:false}];
  }

  const last=steps[steps.length-1];
  const lunchBase=Math.max(toMins(last?.time||"11:00")+60,toMins("12:00"));
  const lunchTime=fromMins(Math.min(lunchBase,depMins-150));
  const prepTime=addMins(deptTime,-35);
  const returnEst=addMins(CONCERT.showEnd,50);
  const bd=BUDGET[budget]||BUDGET.Mid;

  steps.push(
    {id:"lunch",time:lunchTime,icon:"🍽",label:"EAT",note:bd.food.spots[0],sub:`${bd.food.est} — eat before gates, venue food is 3× street price`,hl:false},
    {id:"prep",time:prepTime,icon:"🎒",label:"FINAL PREP",note:"Run through packing checklist. Screenshot ticket.",sub:"Cash ready, UPI working, power bank full",hl:false},
    {id:"depart",time:deptTime,icon:"⚡",label:"DEPART FOR VENUE",note:`${transport} → JLN Stadium`,sub:`~${travel} min${etaMins?" (live traffic)":""} · Traffic builds after 16:30`,hl:true},
    {id:"gates",time:CONCERT.gatesOpen,icon:"🎫",label:"GATES OPEN",note:"Jawaharlal Nehru Stadium",sub:"ID + QR ready. Merch booth opens here — go early for limited items",hl:false},
    {id:"show",time:CONCERT.showStart,icon:"🎤",label:"YE LIVE IN INDIA",note:CONCERT.artist+" takes the stage",sub:"Heartless · Runaway · Gold Digger · Stronger · Famous · Power",hl:true},
    {id:"end",time:CONCERT.showEnd,icon:"🌙",label:"SHOW ENDS (~)",note:"±30 min variance — Ye often runs over",sub:"Don't plan late dinner reservations on this day",hl:false},
    {id:"return",time:returnEst,icon:"🏠",label:"EST. RETURN",note:`Back to ${hotelPlace?.name||"hotel"}`,sub:"JLN Stadium metro (Violet Line) or Mathura Road cab",hl:false},
  );
  return {steps,deptTime,travel,etaMins,transport,budget,arrType,arrTime,arrLoc,hotelWake,hotelPlace,builtAt:Date.now()};
}

function buildTripPlan({daysOption,arrType,arrTime,arrLoc,hotelWake,hotelPlace,transport,budget,depPoint,depTime,depDate}){
  const budgetKey=budget==="Low"?"Low":budget==="High"?"High":"Mid";
  const days=[];
  if(daysOption==="day-before"||daysOption==="both"){
    days.push({date:dateAdd(CONCERT.date,-1),type:"explore",dir:"before",label:"Explore Delhi",templateKey:`before_${budgetKey}`});
  }
  days.push({date:CONCERT.date,type:"concert",label:"Concert Day — Ye Live in India"});
  if(daysOption==="day-after"||daysOption==="both"){
    days.push({date:dateAdd(CONCERT.date,1),type:"explore",dir:"after",label:"Explore Delhi",templateKey:`after_${budgetKey}`});
  }

  // Departure logistics
  const depOpt=DEPARTURE_POINTS.find(d=>d.value===depPoint)||DEPARTURE_POINTS[1];
  const leaveHotelTime=fromMins(toMins(depTime||"18:00")-depOpt.prepMins);

  return {days,daysOption,budget,transport,hotelPlace,depPoint,depTime,depDate,leaveHotelTime,depLabel:depOpt.label,builtAt:Date.now()};
}

// ─── COPILOT AI ───────────────────────────────────────────────────────────────
function copilotReply(msg,cPlan,tPlan,food){
  const q=msg.toLowerCase();
  const gateLeft=minsUntil(CONCERT.date,CONCERT.gatesOpen);
  const depLeft=cPlan?minsUntil(CONCERT.date,cPlan.deptTime):null;

  if(q.match(/leave|when.*depart|departure time/)){
    if(!cPlan) return "Go to the **Plan** tab first — I'll calculate your exact departure time with live traffic.";
    if(depLeft<0) return `⚡ You should have left ${Math.abs(depLeft)} min ago. Cab NOW to JLN Stadium — tell driver: Bhishma Pitamah Marg.`;
    if(depLeft<30) return `🔴 Leave in **${depLeft} min** at **${fmtTime(cPlan.deptTime)}**. Stop everything now.`;
    return `Leave at **${fmtTime(cPlan.deptTime)}** — ${depLeft} min from now.\n\nVia ${cPlan.transport} · ~${cPlan.travel} min${cPlan.etaMins?" (live traffic)":""}.\nTraffic near JLN Stadium spikes hard after 16:30.`;
  }
  if(q.match(/late|on time|hurry|make it/)){
    if(gateLeft<0) return `⚡ Gates opened ${Math.abs(gateLeft)} min ago. Cab NOW — "JLN Stadium, Gate 2 side, Bhishma Pitamah Marg."`;
    if(gateLeft<45) return `🔴 Only ${gateLeft} min until gates. **Leave immediately** — cab is fastest right now.`;
    if(depLeft!==null&&depLeft<0) return `🟡 ${Math.abs(depLeft)} min behind your plan. Leave now — traffic window is closing.`;
    return `🟢 ${gateLeft} min until gates. You're on schedule — depart at ${cPlan?fmtTime(cPlan.deptTime):"your planned time"}.`;
  }
  if(q.match(/food|eat|hungry|restaurant|where.*eat/)){
    if(food?.length) return `Live results near JLN Stadium:\n\n${food.slice(0,4).map(f=>`• **${f.name}**${f.rating?` ★${f.rating}`:""}${f.open===false?" (closed)":""} — ${f.address}`).join("\n")}\n\nEat before **${fmtTime(CONCERT.gatesOpen)}** — venue food is 3× street price.`;
    const bd=BUDGET[cPlan?.budget||"Mid"];
    return `Best for ${cPlan?.budget||"mid"} budget:\n\n${bd.food.spots.map(s=>`• ${s}`).join("\n")}\n\n${bd.tips}`;
  }
  if(q.match(/ticket|price|how much.*ticket|buy|district/))
    return `Confirmed tiers (excl. taxes):\n\n${CONCERT.tickets.map(t=>`• **${t.tier}**: ${t.price} — ${t.note}`).join("\n")}\n\nBook via **District by Zomato** app only. Non-refundable. No re-entry.`;
  if(q.match(/songs|setlist|perform|what.*play/))
    return `Expected hits:\n\n${CONCERT.setlist.map(s=>`• ${s}`).join("\n")}\n\nYe's sets span his full catalogue. Runtime: 2–2.5 hrs typically.`;
  if(q.match(/exit|after show|post.?show|leave venue/))
    return `Post-show exit:\n\n• Wait 10–15 min after last song — crowd thins fast\n• **JLN Stadium metro** (Violet Line) — 5 min walk, fastest option\n• Cab: head to Mathura Road side, avoid main gate chaos\n• Tell driver: "Bhishma Pitamah Marg south side"\n• Last metro ~23:00 — plan your return`;
  if(q.match(/delhi.*see|sightseeing|visit|explore|what.*do/))
    return `Delhi highlights:\n\n• **Old Delhi** 🕌 — Jama Masjid, Chandni Chowk, Red Fort, Paranthe Wali Gali\n• **South Delhi** 🌿 — Humayun's Tomb (near venue!), Lodhi Garden, Khan Market\n• **Central** 🏛 — India Gate, Connaught Place, Jantar Mantar\n• **North/Other** 🏰 — Qutub Minar, Hauz Khas Village, Akshardham\n\nAdd extra days in the **Plan** tab for a full day-by-day Delhi itinerary.`;
  if(q.match(/weather|rain|temp|cold|hot|wear/))
    return `Delhi late March:\n\n• Day: 28–35°C (hot, sunny)\n• Evening showtime: 22–27°C\n• Low rain probability in late March\n• Wear: Light breathable clothes + thin jacket for post-show\n• Stay hydrated — outdoor stadium in pre-summer heat`;
  if(q.match(/park|drive|car/))
    return `⚠️ No parking inside venue (officially confirmed).\n\nOptions:\n• Park + Metro: INA/Jor Bagh lots → Metro to JLN Stadium\n• Pragati Maidan lots (0.8 km walk to venue)\n\nCab or metro is faster for most people.`;
  if(q.match(/plan|schedule|itinerary|my day|timeline/)){
    if(!cPlan) return "Go to the **Plan** tab — choose arrival type, hotel, days in Delhi, and departure. I'll build your complete multi-day trip.";
    return `Your concert day:\n\n${cPlan.steps.slice(0,6).map(s=>`${fmtTime(s.time)} — ${s.label}`).join("\n")}\n\nDepart at **${fmtTime(cPlan.deptTime)}** via ${cPlan.transport}.${tPlan&&tPlan.days.length>1?`\n\nYour full trip: ${tPlan.days.length} days in Delhi.`:""}`;
  }
  if(q.match(/budget|cost|spend/)){
    const b=cPlan?.budget||"Mid";
    const bd=BUDGET[b];
    return `**${bd.label}** concert day:\n\nFood: ${bd.food.est}\nTransport: ${bd.transport.est}\nTotal: **${bd.total}**\n\n${bd.tips}`;
  }
  if(q.match(/bag|allowed|prohibited|bring/))
    return `Venue rules:\n\n• ${CONCERT.bagPolicy}\n• No: ${CONCERT.prohibited}\n• Allowed: sealed empty water bottle, small pouch/wallet\n• ${CONCERT.insideFood}\n• Age limit: ${CONCERT.ageLimit}`;
  if(q.match(/metro|dmrc|violet line/))
    return `Metro to venue:\n\n• **JLN Stadium station** (Violet Line) — 5 min walk to venue\n• Jangpura (Violet Line) — 10 min walk\n• From New Delhi station: Yellow Line → Violet Line (Kashmere Gate transfer)\n• Last metro ~23:00 — check DMRC app for event extensions`;
  return `I'm **COPILOT** — your Ye Live in India concert AI.\n\nAsk me:\n• "When should I leave?"\n• "Am I late?"\n• "Food near venue"\n• "My full plan"\n• "Exit after show"\n• "What songs will he play?"\n• "Ticket prices"\n• "What to see in Delhi"\n• "Weather on show day"\n• "Bag rules"`;
}

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const DB_KEY   = "donda_v6_db";
const SESS_KEY = "donda_v6_sess";
const getDB    = () => { try{return JSON.parse(localStorage.getItem(DB_KEY)||"{}");}catch{return{};} };
const saveDB   = d  => localStorage.setItem(DB_KEY,JSON.stringify(d));
const getSess  = () => { try{return JSON.parse(localStorage.getItem(SESS_KEY));}catch{return null;} };
const saveSess = u  => localStorage.setItem(SESS_KEY,JSON.stringify({...u,at:Date.now()}));
const clearSess= () => localStorage.removeItem(SESS_KEY);
function getUserData(email){ const db=getDB(); return db[email]||{concertPlan:null,tripPlan:null,notes:"",checklist:{},msgs:[],createdAt:Date.now()}; }
function patchUser(email,patch){ const db=getDB(); db[email]={...getUserData(email),...patch,updatedAt:Date.now()}; saveDB(db); }

// ─── GOOGLE IDENTITY SERVICES ─────────────────────────────────────────────────
function loadGIS(){
  return new Promise(res=>{
    if(window.google?.accounts){res(window.google.accounts);return;}
    const s=document.createElement("script");
    s.src="https://accounts.google.com/gsi/client";
    s.async=true; s.onload=()=>res(window.google?.accounts);
    document.head.appendChild(s);
  });
}
const parseJWT=t=>{try{return JSON.parse(atob(t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));}catch{return null;}};

// ─── COUNTDOWN ───────────────────────────────────────────────────────────────
function useCountdown(){
  const [cd,setCd]=useState({days:0,h:0,m:0,s:0,past:false});
  useEffect(()=>{
    const t=new Date(`${CONCERT.date}T${CONCERT.showStart}:00`);
    const tick=()=>{
      const d=t-new Date();
      if(d<=0){setCd({days:0,h:0,m:0,s:0,past:true});return;}
      const days=Math.floor(d/86400000),rem=d%86400000;
      setCd({days,h:Math.floor(rem/3600000),m:Math.floor((rem%3600000)/60000),s:Math.floor((rem%60000)/1000),past:false});
    };
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[]);
  return cd;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--void:#040404;--black:#090909;--panel:#0e0e0e;--white:#e8e4dc;--off:#b0aca4;--dim:#636058;--accent:#c8b89a;--green:#4ade80;--red:#f87171;--amber:#fbbf24;--blue:#60a5fa;--border:rgba(200,184,154,.1);--border2:rgba(200,184,154,.22);}
html,body{height:100%;overflow:hidden}
body{background:var(--void);color:var(--white);font-family:'Barlow Condensed',sans-serif;font-size:18px;-webkit-font-smoothing:antialiased}
input,select,textarea,button{font-family:inherit}
.grain{position:fixed;inset:0;pointer-events:none;z-index:9998;opacity:.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.app{height:100dvh;display:flex;flex-direction:column;max-width:430px;margin:0 auto;overflow:hidden;background:var(--void)}
.glitch{position:relative;display:inline-block}
.glitch::before,.glitch::after{content:attr(data-text);position:absolute;top:0;left:0;color:var(--white)}
.glitch::before{animation:g1 6s infinite;clip-path:polygon(0 20%,100% 20%,100% 42%,0 42%);transform:translateX(-2px);color:var(--accent);opacity:.28}
.glitch::after{animation:g2 6s infinite;clip-path:polygon(0 60%,100% 60%,100% 78%,0 78%);transform:translateX(2px);color:#5555ee;opacity:.18}
@keyframes g1{0%,93%,100%{opacity:0}94%{opacity:.28;transform:translateX(-2px)}96%{transform:translateX(3px)}98%{opacity:0}}
@keyframes g2{0%,90%,100%{opacity:0}91%{opacity:.18;transform:translateX(2px)}94%{transform:translateX(-3px)}96%{opacity:0}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes blink{0%,100%{opacity:.4}50%{opacity:0}}
@keyframes scan{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
@keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(200,184,154,0)}50%{box-shadow:0 0 18px 3px rgba(200,184,154,.12)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
@keyframes flicker{0%,95%,100%{opacity:1}96%{opacity:.75}98%{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
/* HEADER */
.hdr{padding:14px 18px 12px;border-bottom:1px solid var(--border);flex-shrink:0}
.hdr-ey{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.22em;color:var(--dim);text-transform:uppercase;margin-bottom:2px}
.hdr-title{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:.07em;line-height:1;display:flex;align-items:center;gap:5px}
.hdr-slash{color:var(--accent)}
.hdr-sub{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;color:var(--dim);margin-top:4px;display:flex;align-items:center;gap:10px}
.live-dot{display:inline-flex;align-items:center;gap:4px;color:var(--green);font-size:10px}
.live-dot::before{content:'';width:5px;height:5px;background:var(--green);border-radius:50%;box-shadow:0 0 5px var(--green);animation:pulse 2s infinite}
/* NAV */
.nav{display:flex;background:#111;border-bottom:1px solid rgba(200,184,154,.2);flex-shrink:0;overflow-x:auto;scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.nb{flex:1;min-width:64px;padding:14px 4px 11px;background:none;border:none;color:#b0a898;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:all .18s;position:relative;text-align:center;white-space:nowrap}
.nb:hover{color:#b0a898;background:rgba(200,184,154,.04)}
.nb.on{color:var(--accent);background:rgba(200,184,154,.08)}
.nb.on::after{content:'';position:absolute;bottom:0;left:10%;right:10%;height:2px;background:var(--accent);border-radius:1px}
.nb-ic{display:block;font-size:19px;margin-bottom:5px;line-height:1}
.nb-badge{position:absolute;top:8px;right:calc(50% - 26px);background:var(--accent);color:var(--void);font-family:'Bebas Neue',sans-serif;font-size:9px;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center}
/* CONTENT */
.content{flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
.content.chatmode{overflow:hidden;display:flex;flex-direction:column}
.screen{padding:16px;animation:fadeUp .25s ease}
::-webkit-scrollbar{width:2px}
::-webkit-scrollbar-thumb{background:var(--border)}
/* SHARED */
.lbl{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.18em;color:var(--dim);text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.upill{display:flex;align-items:center;gap:9px;background:rgba(200,184,154,.05);border:1px solid var(--border);padding:8px 12px;margin-bottom:14px}
.upill-av{width:30px;height:30px;border-radius:50%;overflow:hidden;flex-shrink:0;background:var(--accent);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--void)}
.upill-av img{width:100%;height:100%;object-fit:cover}
.upill-name{font-family:'Space Mono',monospace;font-size:11px;color:var(--white)}
.upill-saved{font-family:'Space Mono',monospace;font-size:10px;color:var(--green);margin-top:2px}
/* COUNTDOWN */
.cdb{background:var(--black);border:1px solid var(--border);padding:18px;margin-bottom:14px;position:relative;overflow:hidden}
.cdb::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);animation:scan 4s infinite}
.cdb-lbl{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.2em;color:var(--accent);text-transform:uppercase;text-align:center;margin-bottom:12px}
.cdb-nums{display:flex;gap:10px;align-items:flex-start;justify-content:center}
.cdn{text-align:center}
.cdn-d{font-family:'Bebas Neue',sans-serif;font-size:54px;line-height:1;color:var(--white);display:block;font-variant-numeric:tabular-nums}
.cdn-u{font-family:'Space Mono',monospace;font-size:9px;color:var(--dim);letter-spacing:.14em;display:block;margin-top:3px}
.cdn-sep{font-family:'Bebas Neue',sans-serif;font-size:40px;color:var(--accent);opacity:.4;animation:blink 1s infinite;margin-top:6px}
/* EVENT CARD */
.eic{background:var(--black);border:1px solid var(--border);padding:16px;margin-bottom:14px}
.eic-ey{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:.16em;margin-bottom:5px}
.eic-name{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:.05em;margin-bottom:4px;line-height:1.1}
.eic-org{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);margin-top:5px;line-height:1.6}
.chips{display:flex;gap:5px;margin-top:12px;flex-wrap:wrap}
.chip{flex:1;min-width:55px;background:rgba(200,184,154,.05);border:1px solid var(--border);padding:8px 4px;text-align:center}
.chip-l{font-family:'Space Mono',monospace;font-size:9px;color:var(--dim);letter-spacing:.1em}
.chip-v{font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--accent);line-height:1.1}
/* DEPART HERO */
.dep-hero{background:var(--black);border:1px solid var(--border2);padding:16px;margin-bottom:14px;position:relative;overflow:hidden;display:flex;justify-content:space-between;align-items:center}
.dep-hero::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);animation:scan 4s infinite}
.dep-time{font-family:'Bebas Neue',sans-serif;font-size:56px;color:var(--accent);line-height:1}
.dep-right{text-align:right}
.dep-via{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim)}
.dep-eta{font-family:'Barlow Condensed',sans-serif;font-size:15px;color:var(--white);margin-top:4px}
/* BANNERS */
.banner{padding:11px 14px;margin-bottom:14px;font-family:'Space Mono',monospace;font-size:11px;line-height:1.6}
.banner.red{background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);color:var(--red)}
.banner.amber{background:rgba(251,191,36,.07);border:1px solid rgba(251,191,36,.25);color:var(--amber)}
.banner.green{background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.2);color:var(--green)}
.banner.blue{background:rgba(96,165,250,.07);border:1px solid rgba(96,165,250,.25);color:var(--blue)}
/* MAP EMBED */
/* venue-dir-card */
.venue-dir-card{display:flex;align-items:center;justify-content:space-between;background:var(--black);border:1px solid var(--border2);padding:16px 18px;margin-bottom:16px;text-decoration:none;transition:border-color .2s;position:relative;overflow:hidden}
.venue-dir-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);animation:scan 4s infinite}
.venue-dir-card:hover{border-color:var(--accent)}
.venue-dir-left{display:flex;align-items:flex-start;gap:14px;flex:1}
.venue-dir-icon{font-size:26px;flex-shrink:0;margin-top:2px}
.venue-dir-name{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:.06em;color:var(--white);line-height:1.1;margin-bottom:4px}
.venue-dir-addr{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);line-height:1.55;margin-bottom:5px}
.venue-dir-meta{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:.08em}
.venue-dir-arrow{font-family:'Bebas Neue',sans-serif;font-size:13px;color:var(--accent);letter-spacing:.12em;text-align:center;flex-shrink:0;line-height:1.4;border:1px solid rgba(200,184,154,.25);padding:8px 10px;margin-left:12px}
/* MAP LINKS */
.mlink{display:flex;align-items:center;gap:10px;background:var(--black);border:1px solid var(--border);color:var(--white);width:100%;padding:13px 14px;cursor:pointer;text-align:left;transition:border-color .2s;margin-bottom:8px;text-decoration:none}
.mlink:hover{border-color:var(--border2)}
.ml-ic{font-size:18px}
.ml-t{font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:.06em}
.ml-s{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);margin-top:2px}
.ml-arr{color:var(--accent);font-size:14px;margin-left:auto}
/* PLACE CARDS */
.pc{display:flex;align-items:flex-start;gap:10px;background:var(--black);border:1px solid var(--border);padding:11px 13px;margin-bottom:7px;text-decoration:none;color:inherit;transition:border-color .2s}
.pc:hover{border-color:var(--border2)}
.pc-ic{font-size:18px;flex-shrink:0;margin-top:1px}
.pc-name{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:600;letter-spacing:.03em}
.pc-addr{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);margin-top:3px;line-height:1.45}
.pc-rate{font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--accent);margin-left:auto;flex-shrink:0}
.pc-open{font-family:'Space Mono',monospace;font-size:10px;color:var(--green);margin-top:2px}
.pc-closed{font-family:'Space Mono',monospace;font-size:10px;color:var(--red);margin-top:2px}
/* TICKETS */
.tier-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--border)}
.tier-name{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:.05em}
.tier-price{font-family:'Bebas Neue',sans-serif;font-size:24px;color:var(--accent)}
.tier-note{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);margin-top:2px}
/* FORMS */
.fg{margin-bottom:14px}
.fl{display:block;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.14em;color:var(--dim);text-transform:uppercase;margin-bottom:6px}
.fi{width:100%;background:var(--black);border:1px solid var(--border);color:var(--white);font-family:'Barlow Condensed',sans-serif;font-size:17px;padding:11px 13px;outline:none;transition:border-color .2s;-webkit-appearance:none;appearance:none}
.fi:focus{border-color:var(--accent)}
.fi option{background:#0d0d0d}
.fi::placeholder{color:var(--dim)}
.fi-hint{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);margin-top:5px;line-height:1.55}
.fi-ok{font-family:'Space Mono',monospace;font-size:10px;color:var(--green);margin-top:5px}
/* ARRIVAL TABS */
.at{display:flex;gap:2px;background:var(--black);border:1px solid var(--border);padding:3px;margin-bottom:12px}
.atb{flex:1;padding:10px 3px;background:none;border:none;color:var(--dim);font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;transition:all .2s;text-align:center}
.atb.on{background:var(--accent);color:var(--void)}
.atb-ic{display:block;font-size:16px;margin-bottom:3px}
/* BUDGET */
.bg{display:flex;gap:5px;margin-bottom:6px}
.bo{flex:1;padding:11px 4px;background:var(--black);border:1px solid var(--border);color:var(--dim);font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:.1em;cursor:pointer;transition:all .2s;text-align:center}
.bo.on{background:var(--accent);border-color:var(--accent);color:var(--void)}
.bo-sub{font-family:'Space Mono',monospace;font-size:8px;display:block;margin-top:3px}
/* DAYS OPTION */
.day-opt{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--black);border:1px solid var(--border);cursor:pointer;margin-bottom:6px;transition:all .2s}
.day-opt.on{border-color:var(--accent);background:rgba(200,184,154,.06)}
.day-opt-ic{font-size:22px;flex-shrink:0}
.day-opt-title{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:600;letter-spacing:.03em}
.day-opt-desc{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);margin-top:2px}
.day-opt-ck{color:var(--accent);font-size:16px;margin-left:auto}
/* SECTION BOX */
.sbox{background:rgba(200,184,154,.04);border:1px solid var(--border);padding:14px;margin-bottom:14px}
.sbox-label{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:.16em;text-transform:uppercase;margin-bottom:12px}
.sbox.blue{background:rgba(96,165,250,.04);border-color:rgba(96,165,250,.2)}
.sbox.blue .sbox-label{color:var(--blue)}
/* ETA */
.etab{display:flex;align-items:center;gap:10px;background:rgba(200,184,154,.05);border:1px solid var(--border2);padding:11px 14px;margin-bottom:14px}
.etad{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.etad.live{background:var(--green);box-shadow:0 0 6px var(--green);animation:pulse 2s infinite}
.etad.load{background:var(--accent);animation:pulse .8s infinite}
.etad.err{background:var(--dim)}
.eta-t{font-family:'Space Mono',monospace;font-size:11px;color:var(--white)}
.eta-s{font-size:10px;color:var(--dim);margin-top:2px}
/* BUTTONS */
.btn{width:100%;background:var(--accent);color:var(--void);border:none;padding:15px;font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:.15em;cursor:pointer;transition:opacity .2s;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px}
.btn:hover{opacity:.85}
.btn:disabled{opacity:.35;cursor:not-allowed}
.btn.ghost{background:none;border:1px solid var(--border);color:var(--dim);font-size:14px}
.btn.ghost:hover{border-color:var(--accent);color:var(--accent)}
/* DIRTY */
.dirty{background:rgba(251,191,36,.07);border:1px solid rgba(251,191,36,.22);padding:10px 13px;margin-bottom:14px;font-family:'Space Mono',monospace;font-size:10px;color:var(--amber)}
/* DAY CARDS */
.dcard{background:var(--black);border:1px solid var(--border);margin-bottom:10px;overflow:hidden}
.dcard-hdr{padding:12px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;cursor:pointer;transition:background .2s}
.dcard-hdr:hover{background:rgba(200,184,154,.04)}
.dcard-ic{font-size:20px}
.dcard-title{font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:.06em;flex:1}
.dcard-date{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);margin-top:2px}
.dcard-body{padding:14px}
/* TIMELINE */
.tl{position:relative;padding-left:18px}
.tl::before{content:'';position:absolute;left:5px;top:8px;bottom:8px;width:1px;background:linear-gradient(to bottom,var(--accent),var(--border))}
.tli{position:relative;margin-bottom:18px;animation:fadeUp .3s ease both}
.tli::before{content:'';position:absolute;left:-14px;top:6px;width:6px;height:6px;background:var(--accent);border-radius:50%;box-shadow:0 0 6px var(--accent)}
.tli.hl::before{width:8px;height:8px;left:-15px;background:var(--white);box-shadow:0 0 10px var(--white)}
.tli-time{font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--accent);letter-spacing:.04em;line-height:1}
.tli-lbl{font-family:'Barlow Condensed',sans-serif;font-size:17px;color:var(--white);font-weight:600;letter-spacing:.04em}
.tli-note{font-family:'Space Mono',monospace;font-size:11px;color:var(--off);margin-top:3px;line-height:1.55}
.tli-sub{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);margin-top:2px;line-height:1.5}
/* SPOT CARDS */
.spot{background:rgba(200,184,154,.04);border:1px solid var(--border);padding:12px 14px;margin-bottom:7px;text-decoration:none;display:block;transition:border-color .2s}
.spot:hover{border-color:var(--border2)}
.spot-name{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:600;letter-spacing:.03em;color:var(--white)}
.spot-chips{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}
.spot-chip{font-family:'Space Mono',monospace;font-size:9px;color:var(--dim);background:rgba(200,184,154,.06);border:1px solid var(--border);padding:3px 8px}
.spot-tip{font-family:'Space Mono',monospace;font-size:10px;color:var(--off);margin-top:7px;line-height:1.55}
/* DEP SUMMARY */
.dep-sum{background:rgba(96,165,250,.06);border:1px solid rgba(96,165,250,.2);padding:13px;margin-top:12px}
.dep-sum-title{font-family:'Space Mono',monospace;font-size:10px;color:var(--blue);letter-spacing:.14em;margin-bottom:8px}
.dep-sum-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.dep-sum-k{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim)}
.dep-sum-v{font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--blue)}
/* CHECKLIST */
.stabs{display:flex;gap:2px;margin-bottom:14px;background:var(--black);padding:3px;border:1px solid var(--border)}
.stab{flex:1;padding:9px;background:none;border:none;color:var(--dim);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:all .2s}
.stab.on{background:var(--accent);color:var(--void)}
.citem{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer;user-select:none}
.cbox{width:18px;height:18px;border:1px solid var(--dim);flex-shrink:0;position:relative;transition:all .2s}
.cbox.on{background:var(--accent);border-color:var(--accent)}
.cbox.on::after{content:'✓';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--void);font-size:11px;font-weight:700}
.clbl{font-size:15px;color:var(--white);flex:1;letter-spacing:.02em;transition:color .2s;line-height:1.4}
.clbl.done{color:var(--dim);text-decoration:line-through}
.prog{height:3px;background:var(--black);margin-bottom:14px}
.prog-bar{height:100%;background:var(--accent);transition:width .4s}
/* CHAT */
.cw{display:flex;flex-direction:column;height:100%;overflow:hidden}
.ch{padding:12px 16px;border-bottom:1px solid var(--border);background:var(--black);display:flex;align-items:center;gap:9px;flex-shrink:0}
.sdot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);animation:pulse 2s infinite;flex-shrink:0}
.cn{font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:.14em;color:var(--accent)}
.cst{font-family:'Space Mono',monospace;font-size:10px;color:var(--green)}
.ctag{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);margin-left:auto}
.cmsgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
.msg{max-width:92%;animation:fadeUp .22s ease}
.msg.u{align-self:flex-end}
.msg.ai{align-self:flex-start}
.bubble{padding:11px 14px;font-size:13px;line-height:1.65;white-space:pre-wrap}
.msg.u .bubble{background:var(--accent);color:var(--void);font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:600}
.msg.ai .bubble{background:var(--black);border:1px solid var(--border);color:var(--white);font-family:'Space Mono',monospace;font-size:11px}
.msg.ai .bubble strong{color:var(--accent)}
.qrow{display:flex;flex-wrap:wrap;gap:5px;padding:8px 14px 5px;border-top:1px solid var(--border);background:var(--black);flex-shrink:0}
.qp{background:none;border:1px solid var(--border);color:var(--dim);font-family:'Space Mono',monospace;font-size:9px;padding:5px 9px;cursor:pointer;transition:all .2s;white-space:nowrap}
.qp:hover{border-color:var(--accent);color:var(--accent)}
.cirow{padding:10px 14px;border-top:1px solid var(--border);background:var(--black);display:flex;gap:7px;flex-shrink:0}
.cinp{flex:1;background:var(--void);border:1px solid var(--border);color:var(--white);font-family:'Barlow Condensed',sans-serif;font-size:16px;padding:10px 12px;outline:none;transition:border-color .2s}
.cinp:focus{border-color:var(--accent)}
.cinp::placeholder{color:var(--dim)}
.csnd{background:var(--accent);border:none;color:var(--void);padding:10px 15px;font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:.1em;cursor:pointer}
.csnd:hover{opacity:.8}
/* NOTES */
.nta{width:100%;min-height:110px;background:var(--black);border:1px solid var(--border);color:var(--white);font-family:'Space Mono',monospace;font-size:12px;padding:12px;outline:none;resize:vertical;line-height:1.7}
.nta:focus{border-color:var(--accent)}
.sr{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);align-items:flex-start}
.sr-n{font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--accent);flex-shrink:0;width:24px;line-height:1}
.sr-t{font-size:13px;color:var(--dim);line-height:1.55}
.irow{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
.irowk{font-family:'Space Mono',monospace;font-size:9px;color:var(--dim);width:72px;flex-shrink:0;letter-spacing:.08em;padding-top:2px;text-transform:uppercase}
.irowv{font-size:13px;color:var(--white);line-height:1.55;flex:1}
/* AUTH + SPLASH */
.ob{position:fixed;inset:0;background:var(--void);z-index:3000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;text-align:center;animation:fadeUp .5s ease}
.ob-logo{font-family:'Bebas Neue',sans-serif;font-size:60px;letter-spacing:.04em;line-height:.88;margin-bottom:5px}
.ob-s{color:var(--accent);font-size:50px}
.ob-sub{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.22em;color:var(--dim);text-transform:uppercase;margin-bottom:28px}
.ob-enter{width:100%;max-width:260px;background:none;border:1px solid var(--accent);color:var(--accent);font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:.22em;padding:14px;cursor:pointer;animation:glow 2.5s infinite}
.ob-line{width:1px;height:48px;background:linear-gradient(to bottom,transparent,var(--accent),transparent);margin:14px auto}
.ob-tag{font-family:'Barlow Condensed',sans-serif;font-size:15px;color:var(--dim);line-height:1.65;max-width:260px;margin-bottom:26px}
.ob-foot{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:.12em;margin-top:18px}
.auth-wrap{position:fixed;inset:0;background:var(--void);z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;animation:fadeUp .4s ease;overflow-y:auto}
.auth-logo{font-family:'Bebas Neue',sans-serif;font-size:50px;letter-spacing:.04em;line-height:.88;margin-bottom:4px;text-align:center}
.auth-slash{color:var(--accent);font-size:42px}
.auth-sub{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.2em;color:var(--dim);text-transform:uppercase;margin-bottom:22px;text-align:center}
.auth-card{width:100%;max-width:340px;background:var(--black);border:1px solid var(--border);padding:22px}
.auth-tabs{display:flex;gap:2px;margin-bottom:16px;background:var(--void);padding:3px;border:1px solid var(--border)}
.ltab{flex:1;padding:9px;background:none;border:none;color:var(--dim);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:all .2s;text-align:center}
.ltab.on{background:var(--accent);color:var(--void)}
.auth-or{display:flex;align-items:center;gap:10px;margin:16px 0;font-family:'Space Mono',monospace;font-size:10px;color:var(--dim)}
.auth-or::before,.auth-or::after{content:'';flex:1;height:1px;background:var(--border)}
.auth-err{background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.28);padding:10px 12px;font-family:'Space Mono',monospace;font-size:10px;color:var(--red);margin-bottom:12px;line-height:1.6}
.auth-note{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:.06em;margin-top:14px;text-align:center;line-height:1.7}
.spin{display:inline-block;width:16px;height:16px;border:2px solid rgba(200,184,154,.3);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
.flicker{animation:flicker 10s infinite}
/* HOME CTA BLOCK */
.home-cta-block{background:var(--black);border:1px solid var(--border2);padding:22px 20px;margin-top:6px;position:relative;overflow:hidden}
.home-cta-block::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);animation:scan 5s infinite}
.home-cta-eyebrow{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.28em;color:var(--dim);text-transform:uppercase;margin-bottom:10px}
.home-cta-title{font-family:'Bebas Neue',sans-serif;font-size:40px;letter-spacing:.06em;line-height:1;color:var(--white);margin-bottom:12px}
.home-cta-sub{font-family:'Space Mono',monospace;font-size:11px;color:var(--dim);line-height:1.65;margin-bottom:20px}
.home-cta-btn{width:100%;background:var(--accent);color:var(--void);border:none;padding:15px;font-family:'Bebas Neue',sans-serif;font-size:19px;letter-spacing:.18em;cursor:pointer;margin-bottom:10px;display:block;transition:opacity .2s}
.home-cta-btn:hover{opacity:.85}
.home-cta-ghost{width:100%;background:none;border:1px solid var(--border);color:var(--dim);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.1em;padding:12px;cursor:pointer;display:block;transition:all .2s;text-align:center}
.home-cta-ghost:hover{border-color:var(--accent);color:var(--accent)}
/* HOME HERO */
.home-hero{background:var(--black);border:1px solid var(--border2);padding:20px 18px 18px;margin-bottom:14px;position:relative;overflow:hidden}
.home-hero::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);animation:scan 4s infinite}
.home-hero::after{content:'YE';position:absolute;right:-12px;bottom:-20px;font-family:'Bebas Neue',sans-serif;font-size:120px;color:rgba(200,184,154,.04);line-height:1;pointer-events:none;user-select:none}
.home-hero-eye{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.16em;color:var(--dim);text-transform:uppercase;margin-bottom:10px}
.home-hero-name{font-family:'Bebas Neue',sans-serif;font-size:50px;line-height:.95;letter-spacing:.04em;color:var(--white);margin-bottom:10px}
.home-hero-date{font-family:'Space Mono',monospace;font-size:11px;color:var(--accent);letter-spacing:.14em;margin-bottom:18px}
.home-hero-chips{display:flex;align-items:center;gap:0}
.home-chip{text-align:center;padding:0 14px}
.home-chip:first-child{padding-left:0}
.home-chip-val{display:block;font-family:'Bebas Neue',sans-serif;font-size:24px;color:var(--white);line-height:1;letter-spacing:.04em}
.home-chip-lbl{display:block;font-family:'Space Mono',monospace;font-size:9px;color:var(--dim);letter-spacing:.12em;margin-top:3px;text-transform:uppercase}
.home-chip-div{width:1px;height:32px;background:var(--border);flex-shrink:0}
/* HOME TRIP BLOCK */
.home-trip-block{background:rgba(200,184,154,.04);border:1px solid var(--border);padding:14px;margin-bottom:14px}
.home-trip-label{font-family:'Space Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:.2em;text-transform:uppercase;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)}
.home-trip-row{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid rgba(200,184,154,.06)}
.home-trip-ic{font-size:18px;flex-shrink:0}
/* HOME QUICK LINKS */
.home-qlinks{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.home-qlink{display:flex;flex-direction:column;align-items:center;padding:12px 6px;background:var(--black);border:1px solid var(--border);text-decoration:none;transition:border-color .2s;gap:0}
.home-qlink:hover{border-color:var(--border2)}
/* HOME CTA BLOCK */
.home-cta-block{background:var(--black);border:1px solid var(--border2);padding:22px 20px;margin-top:4px;position:relative;overflow:hidden}
.home-cta-block::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);animation:scan 5s infinite}
.home-cta-eyebrow{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.24em;color:var(--dim);text-transform:uppercase;margin-bottom:10px}
.home-cta-title{font-family:'Bebas Neue',sans-serif;font-size:44px;letter-spacing:.05em;line-height:.95;color:var(--white);margin-bottom:12px}
.home-cta-sub{font-family:'Space Mono',monospace;font-size:11px;color:var(--dim);line-height:1.7;margin-bottom:20px}
.home-cta-btn{width:100%;background:var(--accent);color:var(--void);border:none;padding:16px;font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:.18em;cursor:pointer;margin-bottom:10px;display:block;transition:opacity .2s}
.home-cta-btn:hover{opacity:.85}
.home-cta-ghost{width:100%;background:none;border:1px solid rgba(200,184,154,.18);color:rgba(200,184,154,.6);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.1em;padding:13px;cursor:pointer;display:block;transition:all .2s;text-align:center}
.home-cta-ghost:hover{border-color:var(--accent);color:var(--accent)}
/* Google autocomplete dark */
.pac-container{background:#0c0c0c!important;border:1px solid rgba(200,184,154,.2)!important;box-shadow:0 8px 30px rgba(0,0,0,.95)!important;font-family:'Barlow Condensed',sans-serif!important;margin-top:2px!important}
.pac-item{background:#0c0c0c!important;color:var(--white)!important;border-top:1px solid rgba(200,184,154,.07)!important;padding:10px 14px!important;font-size:16px!important;cursor:pointer!important}
.pac-item:hover,.pac-item-selected{background:rgba(200,184,154,.07)!important}
.pac-item-query{color:var(--accent)!important;font-weight:600!important}
.pac-icon{display:none!important}
.pac-matched{color:var(--accent)!important}
`;

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function AuthScreen({onLogin}){
  const [err,setErr]=useState("");
  const gRef=useRef(null);

  useEffect(()=>{
    loadGIS().then(accounts=>{
      if(!accounts) return;
      accounts.id.initialize({
        client_id:GOOGLE_CLIENT_ID,
        callback:(response)=>{
          const payload=parseJWT(response.credential);
          if(!payload){setErr("Google sign-in failed — please try again.");return;}
          const u={email:payload.email,name:payload.name||payload.email.split("@")[0],avatar:payload.picture||null,provider:"google"};
          const db=getDB();
          if(!db[u.email]) db[u.email]={concertPlan:null,tripPlan:null,notes:"",checklist:{},msgs:[],createdAt:Date.now()};
          saveDB(db); saveSess(u); onLogin(u);
        },
        auto_select:false,
      });
      if(gRef.current) accounts.id.renderButton(gRef.current,{type:"standard",theme:"filled_white",size:"large",text:"continue_with",shape:"rectangular",width:280});
    });
  },[]);

  const continueAsGuest=()=>{
    const u={email:"guest@local",name:"Guest",avatar:null,provider:"guest"};
    const db=getDB();
    if(!db[u.email]) db[u.email]={concertPlan:null,tripPlan:null,notes:"",checklist:{},msgs:[],createdAt:Date.now()};
    saveDB(db); saveSess(u); onLogin(u);
  };

  return(
    <div className="auth-wrap">
      <div className="auth-logo flicker"><span className="glitch" data-text="YE">YE</span><br/><span className="auth-slash">//</span><br/>DELHI</div>
      <div className="auth-sub">Concert Day Companion · {CONCERT.dateDisplay}</div>
      <div className="auth-card">
        {err&&<div className="auth-err">{err}</div>}
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"var(--dim)",letterSpacing:".12em",textAlign:"center",marginBottom:18,lineHeight:1.6}}>
          Sign in to save your plan,<br/>checklist & notes across sessions.
        </div>
        <div ref={gRef} style={{marginBottom:6,display:"flex",justifyContent:"center"}}/>
        <div className="auth-or">OR</div>
        <button className="btn ghost" onClick={continueAsGuest} style={{marginBottom:0,letterSpacing:".12em",fontSize:15}}>
          CONTINUE AS GUEST
        </button>
        <div className="auth-note">
          Guest data is saved on this device only.<br/>
          Sign in with Google to sync across devices.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function HomeScreen({user,cPlan,tPlan,food,onNav}){
  const cd=useCountdown();
  const depLeft=cPlan?minsUntil(CONCERT.date,cPlan.deptTime):null;
  const gateLeft=minsUntil(CONCERT.date,CONCERT.gatesOpen);
  const urgency=!cPlan?null:gateLeft<0?"past":depLeft<0?"late":depLeft<60?"soon":"ok";

  return(
    <div className="screen" style={{paddingBottom:24}}>

      {/* USER BAR */}
      <div className="upill">
        <div className="upill-av">{user.avatar?<img src={user.avatar} alt=""/>:user.name[0].toUpperCase()}</div>
        <div style={{flex:1}}>
          <div className="upill-name">{user.name}</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:user.provider==="guest"?"var(--dim)":"var(--green)",marginTop:2}}>
            {user.provider==="guest"?"GUEST MODE":`${(cPlan||tPlan)?"✓ PLAN SAVED · ":""}SIGNED IN`}
          </div>
        </div>
        {food?.length>0&&<span className="live-dot">LIVE</span>}
      </div>

      {/* URGENCY BANNERS */}
      {urgency==="late"&&<div className="banner red">⚡ BEHIND SCHEDULE — LEAVE FOR VENUE NOW</div>}
      {urgency==="soon"&&<div className="banner amber">⏱ DEPART IN {depLeft} MIN — GET READY NOW</div>}
      {urgency==="ok"&&<div className="banner green">✓ ON SCHEDULE — DEPART {fmtTime(cPlan.deptTime)} VIA {cPlan.transport.toUpperCase()}</div>}

      {/* COUNTDOWN */}
      <div className="cdb flicker">
        <div className="cdb-lbl">{cd.past?"YE IS ON STAGE":cd.days>0?"DAYS UNTIL YE LIVE IN INDIA":"HOURS UNTIL YE TAKES THE STAGE"}</div>
        {!cd.past?(
          <div className="cdb-nums">
            {cd.days>0&&<><div className="cdn"><span className="cdn-d">{String(cd.days).padStart(2,"0")}</span><span className="cdn-u">DAYS</span></div><span className="cdn-sep">:</span></>}
            <div className="cdn"><span className="cdn-d">{String(cd.h).padStart(2,"0")}</span><span className="cdn-u">HRS</span></div>
            <span className="cdn-sep">:</span>
            <div className="cdn"><span className="cdn-d">{String(cd.m).padStart(2,"0")}</span><span className="cdn-u">MIN</span></div>
            <span className="cdn-sep">:</span>
            <div className="cdn"><span className="cdn-d">{String(cd.s).padStart(2,"0")}</span><span className="cdn-u">SEC</span></div>
          </div>
        ):<div style={{textAlign:"center",padding:"14px 0",fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:"var(--accent)",letterSpacing:".12em",animation:"pulse 1.5s infinite"}}>◉ LIVE NOW</div>}
      </div>

      {/* EVENT HERO CARD */}
      <div className="home-hero">
        <div className="home-hero-eye">CONFIRMED · JAWAHARLAL NEHRU STADIUM · NEW DELHI</div>
        <div className="home-hero-name flicker">
          <span className="glitch" data-text="YE LIVE">YE LIVE</span><br/>
          <span className="glitch" data-text="IN INDIA">IN INDIA</span>
        </div>
        <div className="home-hero-date">Sunday, 29 March 2026</div>
        <div className="home-hero-chips">
          <div className="home-chip"><span className="home-chip-val">5 PM</span><span className="home-chip-lbl">GATES</span></div>
          <div className="home-chip-div"/>
          <div className="home-chip"><span className="home-chip-val">8 PM</span><span className="home-chip-lbl">SHOW</span></div>
          <div className="home-chip-div"/>
          <div className="home-chip"><span className="home-chip-val">~10:30</span><span className="home-chip-lbl">END</span></div>
          <div className="home-chip-div"/>
          <div className="home-chip"><span className="home-chip-val">5 MIN</span><span className="home-chip-lbl">METRO</span></div>
        </div>
      </div>

      {/* DEPART BLOCK — shown only when plan exists */}
      {cPlan&&(
        <div className="dep-hero">
          <div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"var(--dim)",letterSpacing:".2em",marginBottom:4,textTransform:"uppercase"}}>Your Depart Time</div>
            <div className="dep-time">{fmtTime(cPlan.deptTime)}</div>
            {cPlan.hotelPlace&&<div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"var(--dim)",marginTop:3}}>from {cPlan.hotelPlace.name}</div>}
          </div>
          <div className="dep-right">
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"var(--dim)",marginBottom:4}}>via {cPlan.transport}</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"var(--white)"}}>{cPlan.etaMins?`📡 ${cPlan.travel} MIN LIVE`:`~${cPlan.travel} MIN`}</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:3}}>to JLN Stadium</div>
          </div>
        </div>
      )}

      {/* MULTI-DAY TRIP OVERVIEW */}
      {tPlan&&tPlan.days.length>1&&(
        <div className="home-trip-block">
          <div className="home-trip-label">YOUR DELHI TRIP — {tPlan.days.length} DAYS</div>
          {tPlan.days.map((d,i)=>(
            <div key={i} className="home-trip-row">
              <span className="home-trip-ic">{d.type==="concert"?"🎤":"🗺️"}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:600,color:d.type==="concert"?"var(--accent)":"var(--white)"}}>{d.label}</div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"var(--dim)",marginTop:2}}>{fmtDate(d.date)}</div>
              </div>
              {d.type==="concert"&&<span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"var(--accent)",border:"1px solid rgba(200,184,154,.2)",padding:"3px 7px"}}>SHOW</span>}
            </div>
          ))}
          {tPlan.depPoint&&<div style={{marginTop:10,fontFamily:"'Space Mono',monospace",fontSize:11,color:"var(--blue)",background:"rgba(96,165,250,.07)",border:"1px solid rgba(96,165,250,.18)",padding:"8px 12px"}}>🛫 Leave hotel {fmtTime(tPlan.leaveHotelTime)} → {tPlan.depLabel?.split("—")[0]?.trim()}</div>}
        </div>
      )}

      {/* VENUE DIRECTIONS */}
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${CONCERT.venueLat},${CONCERT.venueLng}&travelmode=transit`}
        target="_blank"
        rel="noopener noreferrer"
        className="venue-dir-card"
      >
        <div className="venue-dir-left">
          <div className="venue-dir-icon">📍</div>
          <div>
            <div className="venue-dir-name">Jawaharlal Nehru Stadium</div>
            <div className="venue-dir-addr">Bhishma Pitamah Marg · Pragati Vihar · New Delhi</div>
            <div className="venue-dir-meta">🚇 JLN Stadium · Violet Line · 5 min walk</div>
          </div>
        </div>
        <div className="venue-dir-arrow">GET<br/>DIRECTIONS<br/>→</div>
      </a>

      {/* QUICK LINKS */}
      <div style={{marginBottom:16}}>
        <div className="lbl">QUICK LINKS</div>
        <div className="home-qlinks">
          {[
            {ic:"🗺️",t:"Directions",href:`https://www.google.com/maps/dir/?api=1&destination=${CONCERT.venueLat},${CONCERT.venueLng}&travelmode=transit`},
            {ic:"🚇",t:"Metro",href:"https://www.google.com/maps/search/JLN+Stadium+Metro+Station+New+Delhi"},
            {ic:"🍽️",t:"Food",href:`https://www.google.com/maps/search/restaurant/@${CONCERT.venueLat},${CONCERT.venueLng},15z`},
            {ic:"🏧",t:"ATM",href:`https://www.google.com/maps/search/atm/@${CONCERT.venueLat},${CONCERT.venueLng},15z`},
            {ic:"📱",t:"Tickets",href:CONCERT.ticketUrl},
          ].map((b,i)=>(
            <a key={i} href={b.href} target="_blank" rel="noopener noreferrer" className="home-qlink">
              <span style={{fontSize:22}}>{b.ic}</span>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:4,letterSpacing:".05em"}}>{b.t}</span>
            </a>
          ))}
        </div>
      </div>

      {/* LIVE FOOD */}
      {food?.length>0&&(
        <div style={{marginBottom:16}}>
          <div className="lbl">FOOD NEAR VENUE <span style={{color:"var(--green)",fontSize:10}}>● LIVE</span></div>
          {food.slice(0,4).map((p,i)=>(
            <a key={i} href={`https://www.google.com/maps/place/?q=place_id:${p.placeId}`} target="_blank" rel="noopener noreferrer" className="pc">
              <span className="pc-ic">🍴</span>
              <div style={{flex:1}}><div className="pc-name">{p.name}</div><div className="pc-addr">{p.address}</div>{p.open===true&&<div className="pc-open">● OPEN NOW</div>}{p.open===false&&<div className="pc-closed">● CLOSED</div>}</div>
              {p.rating&&<div className="pc-rate">★{p.rating}</div>}
            </a>
          ))}
        </div>
      )}

      {/* CTA BUTTONS */}
      <div className="home-cta-block">
        <div className="home-cta-eyebrow">{cPlan?"YOUR PLAN IS READY":"NO PLAN YET"}</div>
        <div className="home-cta-title">{cPlan?<>VIEW OR UPDATE<br/>YOUR ITINERARY</>:<>BUILD YOUR<br/>DELHI PLAN</>}</div>
        <div className="home-cta-sub">
          {cPlan
            ? `Departing ${fmtTime(cPlan.deptTime)} via ${cPlan.transport} · ${cPlan.travel} min to venue`
            : "Set arrival, hotel, transport & budget — get a minute-by-minute day plan."}
        </div>
        <button className="home-cta-btn" onClick={()=>onNav("plan")}>
          {cPlan?"▶ VIEW MY PLAN":"▶ BUILD MY PLAN"}
        </button>
        <button className="home-cta-ghost" onClick={()=>onNav("about")}>
          EVENT INFO, TICKETS & RULES →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function PlanScreen({cPlan,tPlan,onSave,user}){
  const saved=cPlan||{};
  const savedTrip=tPlan||{};

  const [daysOpt,    setDaysOpt]    = useState(savedTrip.daysOption||"concert-only");
  const [arrType,    setArrType]    = useState(saved.arrType||"hotel");
  const [arrTime,    setArrTime]    = useState(saved.arrTime||"11:00");
  const [arrLoc,     setArrLoc]     = useState(saved.arrLoc||"");
  const [hotelWake,  setHotelWake]  = useState(saved.hotelWake||"09:00");
  const [hotelPl,    setHotelPl]    = useState(saved.hotelPlace||null);
  const [transport,  setTransport]  = useState(saved.transport||"Metro");
  const [budget,     setBudget]     = useState(saved.budget||"Mid");
  const [depPoint,   setDepPoint]   = useState(savedTrip.depPoint||"dep-t23");
  const [depTime,    setDepTime]    = useState(savedTrip.depTime||"19:00");
  const [depDate,    setDepDate]    = useState(savedTrip.depDate||dateAdd(CONCERT.date,1));

  const [etaState, setEtaState] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [dirty,    setDirty]    = useState(false);
  const [openDay,  setOpenDay]  = useState(null);

  const hotelRef=useRef(null);
  useEffect(()=>{setDirty(true);},[daysOpt,arrType,arrTime,arrLoc,hotelWake,transport,budget,depPoint,depTime,depDate]);
  useEffect(()=>{if(hotelPl)setDirty(true);},[hotelPl]);
  useAutocomplete(hotelRef,p=>{setHotelPl(p);setDirty(true);});

  const generate=async()=>{
    setLoading(true);setEtaState(null);
    let etaMins=null;
    if(hotelPl){
      setEtaState("loading");
      const mode=transport==="Metro"?"TRANSIT":"DRIVING";
      const r=await getLiveETA(hotelPl.lat,hotelPl.lng,mode);
      setEtaState(r||"error");
      if(r) etaMins=r.mins;
    }
    const newCPlan=buildConcertDay({arrType,arrTime,arrLoc,hotelWake,hotelPlace:hotelPl,transport,budget,etaMins});
    const newTPlan=buildTripPlan({daysOption:daysOpt,arrType,arrTime,arrLoc,hotelWake,hotelPlace:hotelPl,transport,budget,depPoint,depTime,depDate});
    onSave(newCPlan,newTPlan);
    setDirty(false);setLoading(false);
    setOpenDay(0);
  };

  const DAYS_OPTS=[
    {v:"concert-only",ic:"🎤",title:"Concert Day Only",desc:"Just 29 March — arrive, show, done"},
    {v:"day-before",  ic:"1️⃣",title:"1 Day Before Concert",desc:"28 Mar: explore Delhi · 29 Mar: concert"},
    {v:"day-after",   ic:"1️⃣",title:"1 Day After Concert",desc:"29 Mar: concert · 30 Mar: explore Delhi"},
    {v:"both",        ic:"3️⃣",title:"Day Before + After (3 Days)",desc:"28 Mar: explore · 29 Mar: concert · 30 Mar: explore"},
  ];
  const ATABS=[{id:"flight",label:"Flight",ic:"✈️"},{id:"train",label:"Train",ic:"🚂"},{id:"hotel",label:"In Delhi",ic:"🏨"}];

  const depOpt=DEPARTURE_POINTS.find(d=>d.value===depPoint)||DEPARTURE_POINTS[1];
  const leaveHotelTime=fromMins(toMins(depTime)-(depOpt?.prepMins||120));

  const budgetKey=budget==="Low"?"Low":budget==="High"?"High":"Mid";
  const depDateOptions=[];
  if(daysOpt==="day-before") depDateOptions.push(CONCERT.date);
  if(daysOpt==="day-after"||daysOpt==="both") depDateOptions.push(dateAdd(CONCERT.date,1));
  if(daysOpt==="both") depDateOptions.push(dateAdd(CONCERT.date,2));

  return(
    <div className="screen">
      <div className="lbl">PLAN YOUR DELHI TRIP</div>
      {dirty&&(cPlan||tPlan)&&<div className="dirty">↻ Settings changed — regenerate to update your plan</div>}

      {/* HOW MANY DAYS */}
      <div className="fg">
        <div className="fl">How many days in Delhi?</div>
        {DAYS_OPTS.map(o=>(
          <div key={o.v} className={`day-opt${daysOpt===o.v?" on":""}`} onClick={()=>setDaysOpt(o.v)}>
            <span className="day-opt-ic">{o.ic}</span>
            <div style={{flex:1}}>
              <div className="day-opt-title">{o.title}</div>
              <div className="day-opt-desc">{o.desc}</div>
            </div>
            {daysOpt===o.v&&<span className="day-opt-ck">✓</span>}
          </div>
        ))}
      </div>

      {/* CONCERT DAY ARRIVAL */}
      <div className="sbox">
        <div className="sbox-label">🎤 Concert Day — 29 March 2026</div>
        <div className="fg" style={{marginBottom:9}}>
          <div className="fl">How are you arriving in Delhi?</div>
          <div className="at">
            {ATABS.map(t=><button key={t.id} className={`atb${arrType===t.id?" on":""}`} onClick={()=>setArrType(t.id)}><span className="atb-ic">{t.ic}</span>{t.label}</button>)}
          </div>
        </div>
        {arrType==="flight"&&(
          <>
            <div className="fg" style={{marginBottom:8}}>
              <label className="fl">Airport Terminal</label>
              <select className="fi" value={arrLoc} onChange={e=>setArrLoc(e.target.value)}>
                <option value="">Select terminal</option>
                {AIRPORTS.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              {arrLoc&&<div className="fi-hint">{AIRPORTS.find(a=>a.value===arrLoc)?.transit}</div>}
            </div>
            <div className="fg" style={{marginBottom:8}}><label className="fl">Flight Landing Time</label><input type="time" className="fi" value={arrTime} onChange={e=>setArrTime(e.target.value)}/></div>
          </>
        )}
        {arrType==="train"&&(
          <>
            <div className="fg" style={{marginBottom:8}}>
              <label className="fl">Railway Station</label>
              <select className="fi" value={arrLoc} onChange={e=>setArrLoc(e.target.value)}>
                <option value="">Select station</option>
                {STATIONS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {arrLoc&&<div className="fi-hint">{STATIONS.find(s=>s.value===arrLoc)?.metro}</div>}
            </div>
            <div className="fg" style={{marginBottom:8}}><label className="fl">Train Arrival Time</label><input type="time" className="fi" value={arrTime} onChange={e=>setArrTime(e.target.value)}/></div>
          </>
        )}
        {arrType==="hotel"&&(
          <div className="fg" style={{marginBottom:8}}><label className="fl">Wake-up Time</label><input type="time" className="fi" value={hotelWake} onChange={e=>setHotelWake(e.target.value)}/></div>
        )}
        <div className="fg" style={{marginBottom:0}}>
          <label className="fl">Transport to Venue</label>
          <select className="fi" value={transport} onChange={e=>setTransport(e.target.value)}>
            {Object.entries(TRANSPORT).map(([k,v])=><option key={k} value={k}>{k} — {v.cost}</option>)}
          </select>
          <div className="fi-hint">{TRANSPORT[transport]?.note}</div>
        </div>
      </div>

      {/* HOTEL */}
      <div className="fg">
        <label className="fl">Hotel / Stay in Delhi</label>
        <input ref={hotelRef} className="fi" placeholder="Search hotel, area or landmark..." defaultValue={hotelPl?.name||""} onChange={e=>{if(!e.target.value)setHotelPl(null);}}/>
        {hotelPl?<div className="fi-ok">✓ {hotelPl.address}</div>:<div className="fi-hint">Type to search → enables live traffic ETA to venue</div>}
      </div>

      {/* BUDGET */}
      <div className="fg">
        <label className="fl">Budget Level</label>
        <div className="bg">
          {Object.entries(BUDGET).map(([k,v])=>(
            <button key={k} className={`bo${budget===k?" on":""}`} onClick={()=>setBudget(k)}>
              {v.label}<span className="bo-sub">{v.total}</span>
            </button>
          ))}
        </div>
        <div className="fi-hint" style={{marginTop:5}}>{BUDGET[budget]?.tips}</div>
      </div>

      {/* LEAVING DELHI */}
      {daysOpt!=="concert-only"&&(
        <div className="sbox blue">
          <div className="sbox-label">🛫 Leaving Delhi</div>
          <div className="fg" style={{marginBottom:8}}>
            <label className="fl">Departing From</label>
            <select className="fi" value={depPoint} onChange={e=>setDepPoint(e.target.value)}>
              {DEPARTURE_POINTS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          {depDateOptions.length>1&&(
            <div className="fg" style={{marginBottom:8}}>
              <label className="fl">Departure Date</label>
              <select className="fi" value={depDate} onChange={e=>setDepDate(e.target.value)}>
                {depDateOptions.map(d=><option key={d} value={d}>{fmtDate(d)}</option>)}
              </select>
            </div>
          )}
          <div className="fg" style={{marginBottom:8}}>
            <label className="fl">Departure Time (flight/train departs at)</label>
            <input type="time" className="fi" value={depTime} onChange={e=>setDepTime(e.target.value)}/>
          </div>
          <div className="dep-sum">
            <div className="dep-sum-title">🧮 LEAVE HOTEL CALCULATION</div>
            <div className="dep-sum-row"><span className="dep-sum-k">Departs at</span><span className="dep-sum-v">{fmtTime(depTime)}</span></div>
            <div className="dep-sum-row"><span className="dep-sum-k">Prep buffer</span><span className="dep-sum-v">{depOpt.prepMins} MIN</span></div>
            <div className="dep-sum-row"><span className="dep-sum-k">Leave hotel by</span><span className="dep-sum-v" style={{color:"var(--amber)"}}>{fmtTime(leaveHotelTime)}</span></div>
          </div>
        </div>
      )}

      {/* ETA STATE */}
      {etaState==="loading"&&<div className="etab"><div className="etad load"/><div className="eta-t">Fetching live traffic to JLN Stadium...</div></div>}
      {etaState?.mins&&<div className="etab"><div className="etad live"/><div><div className="eta-t">{etaState.mins} min to JLN Stadium</div><div className="eta-s">📡 Google Maps live traffic · {etaState.dist}</div></div></div>}
      {etaState==="error"&&<div className="etab"><div className="etad err"/><div><div className="eta-t">Live ETA unavailable — using estimate</div><div className="eta-s">Select hotel from dropdown for live data</div></div></div>}

      <button className="btn" onClick={generate} disabled={loading}>
        {loading?<><div className="spin"/>&nbsp;BUILDING YOUR TRIP...</>:dirty&&(cPlan||tPlan)?"↻ REFRESH MY TRIP PLAN":"▶ GENERATE MY DELHI TRIP PLAN"}
      </button>

      {/* GENERATED TRIP DAYS */}
      {tPlan&&(
        <>
          <div className="lbl" style={{marginTop:4}}>YOUR FULL TRIP — {tPlan.days.length} DAY{tPlan.days.length>1?"S":""} IN DELHI</div>
          {tPlan.days.map((day,di)=>{
            const isConcert=day.type==="concert";
            const tmpl=day.templateKey?DAY_TEMPLATES[day.templateKey]:null;
            const isOpen=openDay===di;
            const isDepDay=tPlan.depDate===day.date&&daysOpt!=="concert-only";

            return(
              <div key={di} className="dcard">
                <div className="dcard-hdr" onClick={()=>setOpenDay(isOpen?null:di)}>
                  <span className="dcard-ic">{isConcert?"🎤":"🗺️"}</span>
                  <div style={{flex:1}}>
                    <div className="dcard-title">{isConcert?"YE LIVE IN INDIA — CONCERT DAY":tmpl?.title||"EXPLORE DELHI"}</div>
                    <div className="dcard-date">{fmtDate(day.date)}{tmpl&&` · ${tmpl.theme}`}</div>
                  </div>
                  <span style={{color:"var(--accent)",fontFamily:"'Space Mono',monospace",fontSize:15}}>{isOpen?"▲":"▼"}</span>
                </div>

                {isOpen&&(
                  <div className="dcard-body">
                    {isConcert&&(
                      <div className="tl">
                        {cPlan.steps.map((s,i)=>(
                          <div key={s.id} className={`tli${s.hl?" hl":""}`} style={{animationDelay:`${i*.04}s`}}>
                            <div className="tli-time">{fmtTime(s.time)}</div>
                            <div className="tli-lbl">{s.icon} {s.label}</div>
                            {s.note&&<div className="tli-note">{s.note}</div>}
                            {s.sub&&<div className="tli-sub">{s.sub}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {!isConcert&&tmpl&&(
                      <>
                        <div className="tl">
                          {tmpl.steps.map((s,i)=>{
                            // Replace last step with departure info if this is the dep day
                            const isLastStep=i===tmpl.steps.length-1;
                            const showDepStep=isDepDay&&isLastStep;
                            return(
                              <div key={i} className="tli" style={{animationDelay:`${i*.04}s`}}>
                                <div className="tli-time">{showDepStep?fmtTime(leaveHotelTime):fmtTime(s.time)}</div>
                                <div className="tli-lbl">{s.icon} {showDepStep?"LEAVE HOTEL FOR DEPARTURE":s.label}</div>
                                {!showDepStep&&s.note&&<div className="tli-note">{s.note}</div>}
                                {!showDepStep&&s.sub&&<div className="tli-sub">{s.sub}</div>}
                                {showDepStep&&<div className="tli-note">{depOpt.label}</div>}
                                {showDepStep&&<div className="tli-sub">Departs {fmtTime(depTime)} · Allow {depOpt.prepMins} min buffer</div>}
                              </div>
                            );
                          })}
                        </div>

                        {/* DELHI SPOTS TO EXPLORE */}
                        <div style={{marginTop:14}}>
                          <div style={{fontFamily:"'Space Mono',monospace",fontSize:15,color:"var(--dim)",letterSpacing:".2em",marginBottom:8,paddingBottom:5,borderBottom:"1px solid var(--border)"}}>HIGHLIGHTS TO EXPLORE</div>
                          {Object.entries(DELHI_SPOTS).slice(0,day.dir==="before"?2:2).flatMap(([zone,zd])=>
                            zd.spots.slice(0,2).map((sp,si)=>(
                              <a key={`${zone}-${si}`} href={`https://www.google.com/maps/search/${sp.maps}`} target="_blank" rel="noopener noreferrer" className="spot">
                                <div className="spot-name">{zd.icon} {sp.name}</div>
                                <div className="spot-chips">
                                  <span className="spot-chip">⏱ ~{sp.time} min</span>
                                  <span className="spot-chip">🕐 Opens {sp.open}</span>
                                  <span className="spot-chip">🎫 {sp.entry}</span>
                                </div>
                                <div className="spot-tip">💡 {sp.tip}</div>
                              </a>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* BUDGET */}
          <div style={{marginTop:12}}>
            <div className="lbl">TRIP BUDGET — {BUDGET[budget]?.label}</div>
            {[
              ["Concert day food",        BUDGET[budget]?.food.est],
              ["Concert day transport",   BUDGET[budget]?.transport.est],
              ["Sightseeing per day",     BUDGET[budget]?.explore.est],
              ["Total concert day",       BUDGET[budget]?.total],
            ].map(([k,v],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                <span style={{fontFamily:"'Space Mono',monospace",fontSize:15,color:"var(--dim)",letterSpacing:".08em",textTransform:"uppercase"}}>{k}</span>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:17,color:i===3?"var(--white)":"var(--accent)"}}>{v}</span>
              </div>
            ))}
            <div style={{marginTop:8}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:17,color:"var(--dim)",marginBottom:5}}>EXPLORE SPOTS — {BUDGET[budget]?.label}</div>
              {BUDGET[budget]?.explore.spots.map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid var(--border)"}}>
                  <span style={{fontSize:17}}>🗺️</span>
                  <span style={{fontSize:15,color:"var(--white)"}}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKLIST SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function ChecklistScreen({user,onSave}){
  const [tab,setTab]=useState("packing");
  const [checked,setChecked]=useState(()=>getUserData(user.email).checklist||{});
  const toggle=key=>{const n={...checked,[key]:!checked[key]};setChecked(n);onSave(n);};
  const items=CHECKLIST[tab];
  const done=items.filter(it=>checked[`${tab}_${it}`]).length;
  return(
    <div className="screen">
      <div className="stabs">
        <button className={`stab${tab==="packing"?" on":""}`} onClick={()=>setTab("packing")}>📦 Packing ({CHECKLIST.packing.filter(i=>checked[`packing_${i}`]).length}/{CHECKLIST.packing.length})</button>
        <button className={`stab${tab==="merch"?" on":""}`} onClick={()=>setTab("merch")}>🧢 Merch ({CHECKLIST.merch.filter(i=>checked[`merch_${i}`]).length}/{CHECKLIST.merch.length})</button>
      </div>
      <div className="lbl">{done}/{items.length} COMPLETE</div>
      <div className="prog"><div className="prog-bar" style={{width:`${items.length?(done/items.length)*100:0}%`}}/></div>
      {items.map((item,i)=>{const key=`${tab}_${item}`,on=!!checked[key];return(
        <div key={i} className="citem" onClick={()=>toggle(key)}>
          <div className={`cbox${on?" on":""}`}/>
          <span className={`clbl${on?" done":""}`}>{item}</span>
        </div>
      );})}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COPILOT SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function CopilotScreen({cPlan,tPlan,user,food,onSaveMsgs}){
  const saved=getUserData(user.email).msgs||[];
  const [msgs,setMsgs]=useState(saved.length?saved:[{role:"ai",text:`COPILOT ONLINE\n\nHey ${user.name.split(" ")[0]} — I'm your Ye Live in India AI.\n\n${cPlan?"Your concert plan is loaded.":"Go to Plan tab to build your itinerary."}${tPlan&&tPlan.days.length>1?` I also have your ${tPlan.days.length}-day Delhi trip.`:""}\n\nAsk me anything.`}]);
  const [input,setInput]=useState("");
  const [typing,setTyping]=useState(false);
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,typing]);

  const send=useCallback((text)=>{
    const msg=text||input;if(!msg.trim())return;
    setInput("");
    const next=[...msgs,{role:"u",text:msg}];
    setMsgs(next);setTyping(true);
    setTimeout(()=>{
      const reply={role:"ai",text:copilotReply(msg,cPlan,tPlan,food)};
      const final=[...next,reply];
      setMsgs(final);onSaveMsgs(final.slice(-50));setTyping(false);
    },450+Math.random()*500);
  },[input,msgs,cPlan,tPlan,user,food]);

  const handleKey=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}};
  const renderTxt=t=>t.split(/(\*\*[^*]+\*\*)/).map((p,i)=>p.startsWith("**")?<strong key={i}>{p.slice(2,-2)}</strong>:p);
  const clear=()=>{const m=[{role:"ai",text:"Chat cleared. Still here — ask me anything."}];setMsgs(m);onSaveMsgs(m);};
  const QPS=["When should I leave?","Am I late?","Food near venue","My full plan","Exit after show","Songs he'll play","Ticket prices","What to see in Delhi","Weather on show day","Bag rules","Metro info"];

  return(
    <div className="cw">
      <div className="ch">
        <div className="sdot"/>
        <span className="cn">COPILOT</span>
        {cPlan&&<span className="cst">✓ PLAN</span>}
        {tPlan&&tPlan.days.length>1&&<span className="cst" style={{color:"var(--blue)",marginLeft:4}}>✓ TRIP</span>}
        <span className="ctag">{user.name.split(" ")[0].toUpperCase()}</span>
        <button onClick={clear} style={{background:"none",border:"none",color:"var(--dim)",fontFamily:"'Space Mono',monospace",fontSize:17,cursor:"pointer",marginLeft:4,letterSpacing:".08em"}}>CLR</button>
      </div>
      <div className="cmsgs">
        {msgs.map((m,i)=><div key={i} className={`msg ${m.role}`}><div className="bubble">{renderTxt(m.text)}</div></div>)}
        {typing&&<div className="msg ai"><div className="bubble" style={{animation:"blink 1s infinite",fontFamily:"'Space Mono',monospace"}}>· · ·</div></div>}
        <div ref={bottomRef}/>
      </div>
      <div className="qrow">{QPS.map((q,i)=><button key={i} className="qp" onClick={()=>send(q)}>{q}</button>)}</div>
      <div className="cirow">
        <input className="cinp" placeholder="Ask COPILOT anything..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}/>
        <button className="csnd" onClick={()=>send()}>SEND</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTES SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function NotesScreen({user,onSave}){
  const [notes,setNotes]=useState(()=>getUserData(user.email).notes||"");
  const save=v=>{setNotes(v);onSave(v);};
  return(
    <div className="screen">
      <div className="lbl">NOTES</div>
      <textarea className="nta" rows={6} placeholder="Gate number · friends' numbers · cab booking ref · hotel address · ticket tier · anything..." value={notes} onChange={e=>save(e.target.value)}/>
      <div style={{fontFamily:"'Space Mono',monospace",fontSize:17,color:"var(--dim)",marginTop:5,marginBottom:18}}>AUTO-SAVED TO YOUR ACCOUNT · {notes.length} CHARS</div>

      <div className="lbl">EVENT DETAILS</div>
      {[
        ["EVENT",   "Ye Live in India"],
        ["DATE",    CONCERT.dateDisplay],
        ["VENUE",   CONCERT.venue],
        ["ADDRESS", CONCERT.venueFull],
        ["GATES",   `${fmtTime(CONCERT.gatesOpen)} IST`],
        ["SHOW",    `${fmtTime(CONCERT.showStart)} IST`],
        ["ENDS ~",  `${fmtTime(CONCERT.showEnd)} IST (±30 min)`],
        ["METRO",   `${CONCERT.metro.station} (${CONCERT.metro.line}) — ${CONCERT.metro.walkMins} min walk`],
        ["TICKETS", "District by Zomato (district.in)"],
        ["PRICES",  "₹6,000 General → ₹30,000 Lounge (excl. taxes)"],
        ["BAGS",    CONCERT.bagPolicy],
        ["NO",      CONCERT.prohibited],
        ["FOOD",    CONCERT.insideFood],
        ["AGE",     CONCERT.ageLimit],
        ["RE-ENTRY","Not permitted once you exit"],
        ["SETLIST", CONCERT.setlist.slice(0,8).join(" · ")+" + more"],
      ].map(([k,v],i)=>(
        <div key={i} className="irow">
          <div className="irowk">{k}</div>
          <div className="irowv">{v}</div>
        </div>
      ))}

      <div style={{marginTop:20}}>
        <div className="lbl">EMERGENCY CONTACTS</div>
        {[["Delhi Police","100"],["Ambulance","108"],["PCR Van","112"],["Delhi Metro","155370"],["Tourist Help","1800111363"]].map(([l,n],i)=>(
          <a key={i} href={`tel:${n}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid var(--border)",textDecoration:"none"}}>
            <span style={{fontSize:16,color:"var(--white)"}}>{l}</span>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:"var(--accent)"}}>{n}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPLASH
// ─────────────────────────────────────────────────────────────────────────────
function Splash({onDone}){
  return(
    <div className="ob">
      <div className="ob-logo flicker"><span className="glitch" data-text="YE">YE</span><br/><span className="ob-s">//</span><br/>DELHI</div>
      <div className="ob-line"/>
      <div className="ob-tag">{CONCERT.dateDisplay}<br/>Jawaharlal Nehru Stadium · New Delhi<br/>India's first Ye concert. One night only.</div>
      <button className="ob-enter" onClick={onDone}>ENTER THE DAY</button>
      <div className="ob-foot">COPILOT AI · GOOGLE MAPS · LIVE DATA · GOOGLE SIGN-IN</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// ABOUT SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function AboutScreen(){
  return(
    <div className="screen">
      <div className="lbl">ABOUT THE SHOW</div>

      <div className="eic" style={{marginBottom:18}}>
        <div className="eic-ey">CONFIRMED — DISTRICT BY ZOMATO</div>
        <div className="eic-name"><span className="glitch" data-text="YE LIVE IN INDIA">YE LIVE IN INDIA</span></div>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:"var(--dim)",marginTop:6,lineHeight:1.65}}>{CONCERT.venueFull}</div>
        <div className="eic-org">{CONCERT.organisers}</div>
      </div>

      <div style={{marginBottom:20}}>
        <div className="lbl">EVENT DETAILS</div>
        {[
          ["Date",        CONCERT.dateDisplay],
          ["Gates Open",  fmtTime(CONCERT.gatesOpen)+" IST"],
          ["Show Start",  fmtTime(CONCERT.showStart)+" IST"],
          ["Est. End",    fmtTime(CONCERT.showEnd)+" IST (±30 min)"],
          ["Venue",       CONCERT.venue],
          ["Metro",       "JLN Stadium · Violet Line · 5 min walk"],
          ["Ticketing",   "District by Zomato (district.in)"],
          ["Age Limit",   CONCERT.ageLimit],
          ["Re-entry",    "Not permitted once you exit"],
          ["Parking",     "No venue parking — Metro or cab only"],
          ["Organisers",  CONCERT.organisers],
        ].map(([k,v],i)=>(
          <div key={i} className="irow">
            <div className="irowk">{k}</div>
            <div className="irowv">{v}</div>
          </div>
        ))}
      </div>

      <div style={{marginBottom:20}}>
        <div className="lbl">TICKET TIERS — CONFIRMED</div>
        {CONCERT.tickets.map((t,i)=>(
          <div key={i} className="tier-row">
            <div><div className="tier-name">{t.tier}</div><div className="tier-note">{t.note}</div></div>
            <div className="tier-price">{t.price}</div>
          </div>
        ))}
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"var(--dim)",marginTop:10,lineHeight:1.7}}>{CONCERT.ticketNote}</div>
        <a href={CONCERT.ticketUrl} target="_blank" rel="noopener noreferrer" className="mlink" style={{marginTop:14}}>
          <span className="ml-ic">📱</span>
          <div><div className="ml-t">BUY TICKETS — DISTRICT BY ZOMATO</div><div className="ml-s">district.in · Official ticketing partner</div></div>
          <span className="ml-arr">→</span>
        </a>
      </div>

      <div style={{marginBottom:20}}>
        <div className="lbl">EXPECTED SETLIST</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:8}}>
          {CONCERT.setlist.map((s,i)=>(
            <div key={i} style={{background:"rgba(200,184,154,.06)",border:"1px solid var(--border)",padding:"7px 12px",fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,color:"var(--white)",letterSpacing:".03em"}}>{s}</div>
          ))}
        </div>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"var(--dim)",lineHeight:1.65}}>Based on recent world tour setlists. Subject to change. Runtime: 2–2.5 hrs.</div>
      </div>

      <div style={{marginBottom:20}}>
        <div className="lbl">VENUE RULES</div>
        {[
          ["🚪","Gates open at 5:00 PM IST — arrive early for merch queues and bag checks"],
          ["👜","Bags no larger than A4 sheet — mandatory check at all gates"],
          ["🚫","No: professional cameras, outside food/drinks, large bags, weapons, laser pointers"],
          ["🚗","No parking inside venue — take Metro (JLN Stadium, Violet Line) or cab"],
          ["🔄","No re-entry after you exit the stadium"],
          ["🚇","Last metro from JLN Stadium station approx. 23:00"],
          ["🔞",`Age limit: ${CONCERT.ageLimit}`],
          ["📍","Share live location with someone before entering"],
          ["🍺",CONCERT.insideFood],
        ].map(([ic,t],i)=>(
          <div key={i} style={{display:"flex",gap:12,padding:"11px 0",borderBottom:"1px solid var(--border)",alignItems:"flex-start"}}>
            <span style={{fontSize:18,flexShrink:0}}>{ic}</span>
            <span style={{fontSize:14,color:"var(--off)",lineHeight:1.6}}>{t}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="lbl">EMERGENCY CONTACTS</div>
        {[["Delhi Police","100"],["Ambulance","108"],["PCR Van","112"],["Delhi Metro","155370"],["Tourist Help","1800111363"]].map(([l,n],i)=>(
          <a key={i} href={`tel:${n}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:"1px solid var(--border)",textDecoration:"none"}}>
            <span style={{fontSize:15,color:"var(--white)"}}>{l}</span>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"var(--accent)"}}>{n}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

const TABS=[
  {id:"home",    label:"Home",    ic:"◈"},
  {id:"plan",    label:"Plan",    ic:"▦"},
  {id:"list",    label:"Checks",  ic:"☰"},
  {id:"copilot", label:"Copilot", ic:"◉"},
  {id:"notes",   label:"Notes",   ic:"▤"},
  {id:"about",   label:"About",   ic:"ℹ"},
];

export default function App(){
  const [splash,  setSplash] = useState(()=>!localStorage.getItem("donda_v6_seen"));
  const [user,    setUser]   = useState(()=>getSess());
  const [tab,     setTab]    = useState("home");
  const [cPlan,   setCPlan]  = useState(null);
  const [tPlan,   setTPlan]  = useState(null);
  const [food,    setFood]   = useState([]);

  useEffect(()=>{
    if(!user) return;
    const data=getUserData(user.email);
    if(data.concertPlan) setCPlan(data.concertPlan);
    if(data.tripPlan)    setTPlan(data.tripPlan);
    loadGMaps().then(()=>{
      getNearby(CONCERT.venueLat,CONCERT.venueLng,"restaurant").then(setFood);
    }).catch(()=>{});
  },[user?.email]);

  const login=u=>{saveSess(u);setUser(u);};

  const logout=()=>{
    clearSess();setUser(null);setCPlan(null);setTPlan(null);setFood([]);setTab("home");
    if(window.google?.accounts?.id) try{window.google.accounts.id.disableAutoSelect();}catch{}
  };

  const savePlans=(cp,tp)=>{
    setCPlan(cp);setTPlan(tp);
    patchUser(user.email,{concertPlan:cp,tripPlan:tp});
  };
  const saveChecklist=c=>patchUser(user.email,{checklist:c});
  const saveNotes=n=>patchUser(user.email,{notes:n});
  const saveMsgs=m=>patchUser(user.email,{msgs:m});

  const clCount=user?Object.values(getUserData(user.email).checklist||{}).filter(Boolean).length:0;

  if(splash) return(
    <>
      <style>{CSS}</style>
      <div className="grain"/>
      <div className="app"><Splash onDone={()=>{localStorage.setItem("donda_v6_seen","1");setSplash(false);}}/></div>
    </>
  );

  if(!user) return(
    <>
      <style>{CSS}</style>
      <div className="grain"/>
      <div className="app"><AuthScreen onLogin={login}/></div>
    </>
  );

  return(
    <>
      <style>{CSS}</style>
      <div className="grain"/>
      <div className="app">
        <div className="hdr">
          <div className="hdr-ey">Concert Day Companion</div>
          <div className="hdr-title flicker">
            <span className="glitch" data-text="YE">YE</span>
            <span className="hdr-slash"> // </span>
            <span className="glitch" data-text="DELHI">DELHI</span>
          </div>
          <div className="hdr-sub">
            <span>29 MAR 2026 · JLN STADIUM</span>
            {food.length>0&&<span className="live-dot">LIVE</span>}
            <button onClick={logout} style={{marginLeft:"auto",background:"none",border:"none",color:"var(--dim)",fontFamily:"'Space Mono',monospace",fontSize:17,cursor:"pointer",letterSpacing:".1em"}}>SIGN OUT</button>
          </div>
        </div>

        <div className="nav">
          {TABS.map(t=>(
            <button key={t.id} className={`nb${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>
              {t.id==="list"&&clCount>0&&<span className="nb-badge">{clCount}</span>}
              <span className="nb-ic">{t.ic}</span>
              <span className="nb-lbl">{t.label}</span>
            </button>
          ))}
        </div>

        <div className={`content${tab==="copilot"?" chatmode":""}`}>
          {tab==="home"    &&<HomeScreen     user={user} cPlan={cPlan} tPlan={tPlan} food={food} onNav={setTab}/>}
          {tab==="plan"    &&<PlanScreen     cPlan={cPlan} tPlan={tPlan} onSave={savePlans} user={user}/>}
          {tab==="list"    &&<ChecklistScreen user={user} onSave={saveChecklist}/>}
          {tab==="copilot" &&<CopilotScreen  cPlan={cPlan} tPlan={tPlan} user={user} food={food} onSaveMsgs={saveMsgs}/>}
          {tab==="notes"   &&<NotesScreen    user={user} onSave={saveNotes}/>}
          {tab==="about"   &&<AboutScreen/>}
        </div>
      </div>
    </>
  );
}
