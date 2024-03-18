const month_name = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let month, year;
let booked = Array.from({length: 32}, () => []);

function malding(i) {
  let output = "";
  booked[i].forEach((data) => {
    output += `<div class="container w-[318px]">
    <div>
      <span class="fs-4 fw-bold">${data.start} - ${data.end}</span>
    </div>
    <div>
      <span>Chủ sở hữu: </span>
      <span>${data.author}</span>
    </div>
    <div>
      <span>Nội dung: </span>
      <span>${data.note}</span>
    </div>
  </div>\n`;
  });
  $("#detail").html(output);
}

async function create_table(year, month) {
  await fetch('/api/book', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({year: year, month: month + 1})
  }).then(response => {
    if (!response.ok) {
      throw new Error (`${response.status}`);
    }
    return response.json();
  }).then(function(outcome) {
    booked = Array.from({length: 32}, () => []);
    outcome.forEach((x) => {
      booked[parseInt(x.date)].push(x);
    });
    console.log(booked);
  });
  $("#detail").html("");
  $("#cr-date").html(`<span style="padding: auto;">${month_name[month]} ${year}</span>`);
  let first_day = new Date(year, month, 1);
  let num_day = ((new Date(year, month + 1, 1)).getTime() - first_day.getTime()) / (1000*3600*24);
  let pos = first_day.getDay();
  let html = "<tr>" + "<th></th>\n".repeat(pos);
  for (let i = 1; i <= num_day; i++) {
    if (pos === 7) {
      html += "</tr>\n<tr>";
      pos = 0;
    }
    //html += `<th class="w-full h-full"><button type="button" onclick="malding(${i})" class="w-full h-full" ${(booked[i].length > 0) ?"style: border-color: red;":""}>${i}</button></th>`;
    html += `<th><div class="w-full h-full m-px text-center cursor-pointer" onclick="malding(${i})" ${(booked[i].length > 0) ?`style="border: 2px solid red;"`:""}>${i}</div></th>`;
    pos++;
  }
  $("#data-table-date").html(html + "<th></th>\n".repeat(7-pos) + "</tr>");
  $("#data-table-date div").css({"border-radius": "50%"});
}

onload = function() {
  let date = new Date();
  month = date.getMonth() ;
  year = date.getFullYear();
  create_table(year, month);
  $("#change-left").on('click', function() {
    if (month === 0) {
      month = 11;
      year--;
    }
    else {
      month--;
    }
    create_table(year, month);
  });
  $("#change-right").on('click', function() {
    if (month === 11) {
      month = 0;
      year++;
    }
    else {
      month++;
    }
    create_table(year, month);
  });
}