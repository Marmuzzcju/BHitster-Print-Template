console.log('Hello World!!');
/*
DINA4
20cm X 29.7cm
=>
2 X 3 cards / page
*/
const
canvas  = Array.from(document.querySelectorAll('canvas')),
ctx     = [],
colors  = {
    pink: "rgb(255, 2, 173)",
    sky: "rgb(2, 179, 255)",
    blue: "rgb(2, 77, 240)",
    yellow: "rgb(254, 242, 46)",
    redish: "rgb(251, 103, 117)",
    rose: "rgb(165, 19, 121)",
    orange: "rgb(250, 63, 16)",
},
cards   = [],
critical_error_log_style = `background-color: red;padding: 2px;font-weight: bolder;font-size: large;`,
non_critical_error_log_style = `background-color: rgba(255,0,0,0.7);padding: 1px;font-weight: bold;`;
important_log_style = `background-color: rgb(50, 250, 50);padding 1px;font-weight: bold;`;
canvas.forEach(c => ctx.push(c.getContext('2d')));
let
card_radi   = 180,
card_offset = 2,
page_width  = 1000,
page_height = 1420,
page_amount = 2,
UI_is_hidden= false,
card_count  = 0,
currently_editing
            = false,
editing_card= 0;


function setup(){
    //scale canvas
    page_width    = window.innerWidth;
    page_height   = page_width * 2**.5 - 1;
    card_radi     = page_width / 6 * 0.95;
    card_offset   = page_width / 6 * 0.05;
    canvas.forEach(c => {
        c.width  = page_width;
        c.height = page_height;
    });
}

function add_card(spotify_link = 'Hello World', release_date = '2000', song_name = 'Super Song', author_name = 'Crazy Author'){
    const new_card = {
        qr_code:'',
        link:   spotify_link,
        date:   release_date,
        song:   song_name,
        author: author_name,
        id:     card_count,
    }

    //create qr code from link
    appoint_qrImg_data(new_card.link, new_card);

    cards.push(new_card);

    //add card to list
    const anchor = document.querySelector('#manual-input');
    let new_ele = `
        <div class="entry">
            <span><img src="img/edit.svg" onclick="edit_card(${card_count});"><img src="img/trash-can.svg"  onclick="delete_card(${card_count});"></span>
            <span>${song_name}</span>
            <span>${author_name}</span>
            <span>${release_date}</span>
            <span>${spotify_link}</span>
        </div>`;
    anchor.insertAdjacentHTML('beforebegin', new_ele);
    
    card_count++;
}

function delete_card(card_id){
    if(!confirm('Are you sure you want to delete this card?')) return;

    let index = card_id < cards.length ? card_id : cards.length-1;

    while(cards[index].id != card_id && index) index--;
    //danger =)

    cards.splice(index, 1);
    document.querySelectorAll('#item-list-anchor > *')[index+1].remove();

    clear_print_pages();
    setTimeout(ready_print_pages, 500);
}

function edit_card(card_id){
    let index = card_id < cards.length ? card_id : cards.length-1,
    identifier= ['link', 'date', 'author', 'song'];

    while(cards[index].id != card_id && index) index--;

    if(currently_editing){
        //save
        let element = 
        document.querySelectorAll('#item-list-anchor > *')[editing_card+1],
        values = [];
        element.querySelectorAll('span').forEach((e, c) => {
            if(c) {
                values.splice(0, 0, e.querySelector('input').value);
                e.remove();
            }
            else e.querySelector('img').src = 'img/edit.svg';
        });
        element = element.querySelector('span');
        console.log(values);
        identifier.forEach((a, c) => {
            cards[editing_card][a] = values[c];
            element.insertAdjacentHTML(`afterend`, `<span>${values[c]}</span>`);
        });

        clear_print_pages();
        setTimeout(ready_print_pages, 500);

        if(editing_card == index){
            //exit
            currently_editing = false;
            return;
        }
    }
    
    currently_editing = true;
    editing_card = index;

    let element = 
    document.querySelectorAll('#item-list-anchor > *')[index+1];
    element.querySelectorAll('span').forEach((e, c) => {
        if(c) e.remove();
        else e.querySelector('img').src = 'img/save.svg';
    });
    element = element.querySelector('span');
    identifier.forEach(a => {
        element.insertAdjacentHTML(`afterend`, `<span><input type='text' value='${cards[index][a]}'></span>`);
        console.log(a);
    });
}

function add_manual_card(){
    const
    inputs = document.querySelectorAll('#manual-input input'),
    error_msgs = ['Song Name must be a String', 'Author Name must be a String', 'Release Year must be a Number', 'Song Link must be a String'];
    let
    valid_input = true,
    input_values = [];
    //validate inout values
    inputs.forEach((i, idx) => {
        console.log(i.value);
        console.log(!!i.value);
        input_values[idx] = i.value;
        if(!i.value) {
            valid_input = false;
            alert(error_msgs[idx]);            
        }
    });
    if(!valid_input) return;

    //check if song link is supported & extract neccesary data
    let
    link = input_values[3],
    valid_link = false,
    data_string = '';
    if(['http', 'https'].includes(link.split(':')[0])){
        //web link
        if(link.split('/')[2].split('.').includes('spotify')){
            //spotify link
            valid_link = true;
            data_string += "spotify:";
            data_string += link.split('/').at(-2);
            data_string += ':';
            data_string += link.split('/').at(-1).split('?')[0];
        }
    }
    if(!valid_link){
        alert(`This type of link is not supported\nIf you believe this is a mistake, feel free to contact me via Marmuzzcju@gmail.com`);
        return;
    }
    //  https://open.spotify.com/track/4v8GJxLdvUiN7R31cKcmNL?si=bf6f91373aa34c82

    if(!confirm(`Add Card with following details:\nSong Name: ${input_values[0]}\nAuthor Name: ${input_values[1]}\nRelease Year: ${input_values[2]}\nSong Link: ${input_values[3]}`))
        return;
    
    add_card(data_string, input_values[2], input_values[0], input_values[1]);

    clear_print_pages();
    setTimeout(ready_print_pages, 500);
}

function appoint_qrImg_data(text, obj){
    const qrcode = new QRCode(document.querySelector('#qr-code-element'), {
    text: text,
    width: 128,
    height: 128,
    colorDark : '#000',
    colorLight : '#fff',
    correctLevel : QRCode.CorrectLevel.H
    });
    obj.qr_code = qrcode["_oDrawing"]["_elImage"];
    document.querySelector('#qr-code-element').innerHTML = '';
}


function clear_print_pages(){
    ctx.forEach(c => {
        c.clearRect(0, 0, 9E9, 9E9);
    })
}

function ready_print_pages(hide_ui){
    if(hide_ui){
        document.querySelector('#item-list-anchor').style.display = 'none';
        UI_is_hidden = true;
        alert(`Use "Ctrl + P" to print\nPress any other button to return the UI`);
    }
    //cards per page: 12 (3x4)
    //note: 2 pages required (front & back page)
    cards.forEach((card, index) => {
        let offset_back = {
            x: (index%3*2)*(card_radi + card_offset) + card_offset,
            y: (Math.floor((index%12)/3)*2)*(card_radi + card_offset) + card_offset// + (Math.floor(index/12) * page_height * 2),
        }, offset_front = {
            x: (2-index%3)*2*(card_radi + card_offset) + card_offset,
            y: offset_back.y,
        }
        page_front = Math.floor(index/12) * 2;
        if(ctx.length<page_front+2) {
            console.log(`%cAdding new page!\nCurrent pages: ${ctx.length}\nPages required: ${page_front+2}`, non_critical_error_log_style);
            add_blank_page();
        }
            draw_back(ctx[page_front], 2*card_radi,offset_back, card);
            draw_front(ctx[page_front+1], 2*card_radi,offset_front, index);
        try{
        } catch {
            console.log(`%cError: couldn't access page: ${page_front} or ${page_front+1}`, critical_error_log_style);
        }
    })
}

function show_help_dialogue(){
    alert(`Input Song Name/Author Name/Song release Year/Song link (currently only spotify links are supported) in the text fields at the top of the page and press "Add Card" after each one. You should see the page update after ~1s, displaying the newly added card.\n
        Once you have added all the cards you want, click "Ready Page to Print". This will hide all UI elements. Afterwards you can use "Ctrl + P" to print the page either to pdf or directly with a connected printer. You can press any other button to return the UI elements.\n
        If you are at the print options menu (after pressing "Ctrl + P"), select "vertical format"; Paper size: "A4"; Scale: "Fit to page width" and Borders: "None".\n
        Most of those settings should be the default but some might have to be selected manually. This ensures that the front & back page fit to each other.\n
        It is recommended to first print the page to pdf before printing it on paper.\n
        If you are going to print the pages, make sure to select "Double-sided printing" and "reflect along the long edge".\n
        Also the last page is usually blanck so it could be ignored when printing.\n
        If there are any further questions, bug reports or suggestions, feel free to contact me via Marmuzzcju@gmail.com`);
}

window.addEventListener('keydown', e => {
    if(UI_is_hidden && ![17, 80].includes(e.keyCode)){
        document.querySelector('#item-list-anchor').style.display = 'inline';
        UI_is_hidden = false;
        console.log(e);
    }
})

function test_print(){
    for(let c=0;c<ctx.length;c++){
        let ct = ctx[c];
        ct.beginPath();
        ct.moveTo(0,0);
        ct.lineTo(150, 0);
        ct.lineTo(150, 50);
        ct.lineTo(70, 50);
        ct.lineTo(220, 200);
        ct.lineTo(200, 220);
        ct.lineTo(50, 70);
        ct.lineTo(50, 150);
        ct.lineTo(0, 150);
        ct.fill();
        ct.textAlign = 'left';
        ct.font = '40px Abel';
        ct.beginPath();
        ct.fillText('Top/Left', 150, 240);
        ct.beginPath();
        ct.moveTo(500,0);
        ct.lineTo(4000, 0);
        ct.lineTo(4000, 30);
        ct.lineTo(500, 30);
        ct.moveTo(0,500);
        ct.lineTo(0, 4000);
        ct.lineTo(30, 4000);
        ct.lineTo(30, 500);
        ct.fill();
    }
}

function add_blank_page(){
    for(let c=0;c<2;c++){
        page_amount++;
        let ele = document.createElement('canvas');
        ele.setAttribute('id', `canvas-page${page_amount}`);
        ele.setAttribute('width', page_width);
        ele.setAttribute('height', page_height);
        document.body.appendChild(ele);
        canvas.push(ele);
        ctx.push(ele.getContext('2d'));
    }
}

function draw_scales(specific, target_ctx_array){
    let targets = Array.from(ctx);
    if(specific) targets = target_ctx_array;
    targets.forEach(ctx => {
        ctx.textAlign = 'center';
        ctx.font = '50px Abel'
        ctx.beginPath();
        for(let x=0;x<2000;x+=50){
            ctx.moveTo(x, 0);
            ctx.lineTo(x, (x%100 ? 10 : 50));
            ctx.fillText(x/10, x, (x%100 ? 35 : 70));
        }
        for(let y=0;y<20000;y+=50){
            ctx.moveTo(0, y);
            ctx.lineTo(12, y);
            ctx.fillText(y/10, 20, y);
        }
        /*for(let y=0;y<2000;y+=50){
            ctx.moveTo(800, y);
            ctx.lineTo(788, y);
            ctx.fillText(y/10, 780, y);
        }*/
        ctx.stroke();
    });
}

function draw_front(ctx, width, offset, card_idx){
    const center = {
        x: offset.x + width / 2,
        y: offset.y + width / 2,
    },
    radi_offset = width * 0.03;
    let radi    = width * 0.467;

    ctx.fillStyle = 'rgb(80, 80, 80)';
    ctx.fillRect(offset.x - 2, offset.y - 2, width + 4, width + 4);
    ctx.fillStyle = 'white';
    ctx.fillRect(offset.x, offset.y, width, width);

    function draw_deco_lines(){
        ctx.strokeStyle = colors.pink;
        ctx.lineWidth = width * 0.01;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(center.x, center.y, radi, Math.PI/16*0, Math.PI/16*27, false);
        ctx.stroke();
        radi -= radi_offset;
        ctx.strokeStyle = colors.blue;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radi, Math.PI/16*17, Math.PI/16*12, false);
        ctx.stroke();
        radi -= radi_offset;
        ctx.strokeStyle = colors.yellow;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radi, Math.PI/16*26, Math.PI/16*22, false);
        ctx.stroke();
        radi -= radi_offset;
        ctx.strokeStyle = colors.pink;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radi, Math.PI/16*12, Math.PI/16*8, false);
        ctx.stroke();
        radi -= radi_offset;
        ctx.strokeStyle = colors.rose;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radi, Math.PI/16*26, Math.PI/16*22, false);
        ctx.stroke();
        radi -= radi_offset;
        ctx.strokeStyle = colors.orange;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radi, Math.PI/16*12, Math.PI/16*6, false);
        ctx.stroke();
        radi -= radi_offset;
        ctx.strokeStyle = colors.blue;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radi, Math.PI/16*3, Math.PI/16*29, false);
        ctx.stroke();
        radi -= radi_offset;
        ctx.strokeStyle = colors.yellow;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radi, Math.PI/16*24, Math.PI/16*16, false);
        ctx.stroke();
    }
    draw_deco_lines();

    //draw qr code
    ctx.fillRect(offset.x + width * 0.28, offset.y + width * 0.28, width * 0.44, width * 0.44);
    ctx.drawImage(cards[card_idx].qr_code, offset.x + width * 0.3, offset.y + width * 0.3, width * 0.4, width * 0.4);
}

function draw_back(ctx, width, offset, card){
    const max_line_length = width * 0.93;
    ctx.fillStyle = 'rgb(180, 0, 90)';
    ctx.fillRect(offset.x, offset.y, width, width);
    ctx.font = `${width*0.09}px Abel`;
    ctx.textAlign = 'center';
    ctx.textBaseline = "middle";
    ctx.fillStyle = 'black';
    let song = {
        total_length: ctx.measureText(card.song).width,
        lines: [card.song],
        line_height: width/10,
        line_amount: 1,
        final_lines: [card.song],
    }; 
    if(song.total_length > max_line_length){
        //too long for good display
        song.lines = card.song.split(' ');
        let space_width = ctx.measureText(' ').width,
            line_start_idx = 0;
        song.lines_length = [[0, 0]];
        song.final_lines = [];
        song.lines.forEach((l, index) => {
            let length = ctx.measureText(l).width
            if(index){
                if(song.lines_length[song.line_amount-1][0] + length + space_width > max_line_length){
                    let full_line = '', start = 0;
                    for(let c=line_start_idx;c<index;c++){
                        full_line += (start ? ' ' : '') + song.lines[c];
                        start = 1;
                    }
                    song.final_lines.push(full_line);
                    song.lines_length[song.line_amount] = [length, 1];
                    song.line_amount++;
                    line_start_idx = index;
                } else {
                    song.lines_length[song.line_amount-1][0] -= -1*(length + space_width);
                    song.lines_length[song.line_amount-1][1]++;
                }
            } else {
                song.lines_length[0][0] = length;
                song.lines_length[0][1] = 1;

            }
            if(index == song.lines.length-1){
                let full_line = '', start = 0;
                for(let c=line_start_idx;c<=index;c++){
                    full_line += (start ? ' ' : '') + song.lines[c];
                    start = 1;
                }
                song.final_lines.push(full_line);
            }
        });
    }
    song.y_offset = song.line_height * (song.line_amount-1) / -2;
    song.final_lines.forEach((line, idx) => {
        ctx.fillText(line, offset.x + width/2, offset.y + width*0.83 + song.y_offset + song.line_height * (idx));
    });
    let author = {
        total_length: ctx.measureText(card.author).width,
        lines: [card.author],
        line_height: width/10,
        line_amount: 1,
        final_lines: [card.author],
    }; 
    if(author.total_length > max_line_length){
        //too long for good display
        //try splitting by ',' in case of multiple names listed
        let name_split = true;
        author.lines = card.author.split(',');
        author.final_lines = [];
        author.lines.forEach((l, idx) => {
            if(ctx.measureText(l).width < max_line_length){
                author.final_lines.push(l);
                if(idx) {
                    author.final_lines[idx-1] += ',';
                    author.line_amount++;
                }
            } else name_split = false;
        });
        if(!name_split){
            //can't split by ','
            //split by each word instead
            author.lines = card.author.split(' ');
            let space_width = ctx.measureText(' ').width,
                line_start_idx = 0,
                lines_length = [[0, 0]];
            author.final_lines = [];
            author.line_amount = 1;
            author.lines.forEach((l, index) => {
                let length = ctx.measureText(l).width
                if(index){
                    if(lines_length[author.line_amount-1][0] + length + space_width > max_line_length){
                        let full_line = '', start = 0;
                        for(let c=line_start_idx;c<index;c++){
                            full_line += (start ? ' ' : '') + author.lines[c];
                            start = 1;
                        }
                        author.final_lines.push(full_line);
                        lines_length[author.line_amount] = [length, 1];
                        author.line_amount++;
                        line_start_idx = index;
                    } else {
                        lines_length[author.line_amount-1][0] -= -1*(length + space_width);
                        lines_length[author.line_amount-1][1]++;
                    }
                } else {
                    lines_length[0][0] = length;
                    lines_length[0][1] = 1;
                }
                if(index == author.lines.length-1){
                    let full_line = '', start = 0;
                    for(let c=line_start_idx;c<=index;c++){
                        full_line += (start ? ' ' : '') + author.lines[c];
                        start = 1;
                    }
                    author.final_lines.push(full_line);
                }
            });
        }
    }
    author.y_offset = author.line_height * (author.line_amount-1) / -2;
    console.log(`%c-- Author --\nY Offset: ${author.y_offset}\nLine Height: ${author.line_height}`, important_log_style);
    console.log(author.lines);
    console.log(author.final_lines);
    author.final_lines.forEach((line, idx) => {
        ctx.fillText(line, offset.x + width/2, offset.y + width*0.2 + author.y_offset + author.line_height * (idx));
    });
    //ctx.fillText(card.author, offset.x + width/2, offset.y + width*0.2);
    ctx.font = `${width*0.25}px Abel`;
    ctx.fillText(card.date, offset.x + width/2, offset.y + width*0.5);
    /*ctx.beginPath();
    ctx.moveTo(offset.x, offset.y + width/2);
    ctx.lineTo(offset.x + width, offset.y + width/2);
    ctx.moveTo(offset.x + width/2, offset.y);
    ctx.lineTo(offset.x + width/2, offset.y + width);
    ctx.stroke();*/
}

function draw_logo(ctx, width = 400, offset = {x:0,y:0}, opacity = 1, shadow = true, text = 'J E S U S'){
    const
    radi_offset = width/36.364,
    max_radius  = width / 2,
    current_alpha = ctx.globalAlpha;
    let r = (max_radius - radi_offset)*0.965;

    ctx.globalAlpha = opacity;

    //black background circle
    ctx.shadowColor = 'black';
    ctx.shadowBlur = shadow ? (offset.x + offset.y)/2 : 0;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(max_radius + offset.x, max_radius + offset.y, max_radius, 0, Math.PI*2, false);
    ctx.fill();
    ctx.shadowBlur = 0;

    //Strikes
    ctx.strokeStyle = colors.pink;
    ctx.lineWidth = width/57;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(max_radius + offset.x, max_radius + offset.y, r, Math.PI/16*1.49, Math.PI/16*12, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(max_radius + offset.x, max_radius + offset.y, r, Math.PI/16*17.47, Math.PI/16*28, false);
    ctx.stroke();
    r -= 2*radi_offset;
    ctx.strokeStyle = colors.sky;
    ctx.beginPath();
    ctx.arc(max_radius + offset.x, max_radius + offset.y, r, Math.PI/16*08, Math.PI/16*14.3, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(max_radius + offset.x, max_radius + offset.y, r, Math.PI/16*17.7, Math.PI/16*21, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(max_radius + offset.x, max_radius + offset.y, r, Math.PI/16*25, Math.PI/16*28, false);
    ctx.stroke();
    r -= 2*radi_offset;
    ctx.strokeStyle = colors.yellow;
    ctx.beginPath();
    ctx.arc(max_radius + offset.x, max_radius + offset.y, r, Math.PI/16*02, Math.PI/16*14, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(max_radius + offset.x, max_radius + offset.y, r, Math.PI/16*18, Math.PI/16*30, false);
    ctx.stroke();
    r -= 2*radi_offset;
    ctx.strokeStyle = colors.pink;
    ctx.beginPath();
    ctx.arc(max_radius + offset.x, max_radius + offset.y, r, Math.PI/16*05, Math.PI/16*13.6, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(max_radius + offset.x, max_radius + offset.y, r, Math.PI/16*18.4, Math.PI/16*27, false);
    ctx.stroke();
    r -= 2*radi_offset;
    ctx.strokeStyle = colors.redish;
    ctx.beginPath();
    ctx.arc(max_radius + offset.x, max_radius + offset.y, r, Math.PI/16*03, Math.PI/16*10, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(max_radius + offset.x, max_radius + offset.y, r, Math.PI/16*22, Math.PI/16*28.88, false);
    ctx.stroke();

    //text
    ctx.shadowColor = colors.pink;
    ctx.shadowBlur = width/50;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${max_radius/1.9}px Abel`;
    ctx.fillText(text, max_radius + offset.x, max_radius*1.04 + offset.y);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = current_alpha;
}


//only works for .txt files as of now...
function handle_file(input){
    console.log(input);
    let
    file = input.files[0],
    reader = new FileReader();

    reader.readAsText(file);

    reader.onload = function () {
      console.log(reader.result);
    };

    reader.onerror = function () {
      console.log(reader.error);
      alert("Error: failed loading map file");
      return;
    };
}

setup();