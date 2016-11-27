(function() {


function $(selector) {
    return document.querySelector(selector);
}

function new_elem(type) {
    return document.createElement(type);
}

function httpGetAsync(theUrl, callback, callback_data, page)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText, callback_data);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

function features_json_received(responseText) {
    const response = JSON.parse(responseText);
    let num_cols = 2;
    const table_head_vardata = $('#feature-support-table > thead > #ua_names');
    const table_head_row = $('#feature-support-table > thead > tr');
    const headers = new Set([...response.user_agents, ...response.feedback]);

    table_head_row.innerHTML += `<th colspan=${response.user_agents.length}>User Agents</th>
        <th colspan=${headers.size - response.user_agents.length}>Other reviewers</th >`;

    for (ua of headers) {
        const th = new_elem('th');
        th.className = num_cols >= response.user_agents.length + 2 ? 'other' : 'UA';
        th.innerHTML = ua;
        table_head_vardata.appendChild(th);
        num_cols ++;
    }

    for (let category of response.svg2_categories) {
        const tbody = new_elem('tbody');
        const tr = new_elem('tr');

        tr.className = 'category';
        tr.innerHTML = `<td colspan=${num_cols}>${category.category}</td>`;

        tbody.appendChild(tr);
        $('#feature-support-table').appendChild(tbody);
        
        for (let feature of category.features) {
            const tr = new_elem('tr');
            tr.innerHTML = `<td class='feature'><p>${feature.name}</p></td><td></td>`;
            tbody.appendChild(tr);

            if (feature.at_risk && feature.at_risk.toLowerCase() == "true") {
                tr.className = 'at_risk';
            }
            
            for (let ua of response.user_agents) {
                const td = new_elem('td');
                td.id = ua;
                td.className = 'UA none';
                tr.appendChild(td);
            }

            if (feature.support) {
                for (let ua_support of feature.support) {
                    if (!ua_support.level)
                        console.log(feature);

                    const ua_td = tr.querySelector(`#${ua_support.name}`);
                    switch (ua_support.level.toLowerCase()) {
                        case 'full': 
                        case 'partial':
                            ua_td.innerHTML = ua_support.level;
                            ua_td.className = ua_support.level;
                            break;
                        case 'n/a':
                            ua_td.innerHTML = ua_support.level;
                            ua_td.className = 'not_applicable';
                            break;
                    }

                    if (ua_support.tracker) {
                        function tracker_links(tracker) {
                            let resolved = '';
                            for (t of Array.isArray(tracker) ? tracker : [tracker]) {
                                resolved += ` [<a href='${t}'>track</a>]`;
                            }
                            return resolved;
                        }
                        ua_td.innerHTML = ua_td.innerHTML + tracker_links(ua_support.tracker);
                    }
                }
            }

            if (feature.feedback) {
                for (let feedback of feature.feedback) {
                    let ua_td = tr.querySelector(`#${feedback.name}`);
                    if (!ua_td) {
                        ua_td = new_elem('td');
                        ua_td.id = feedback;
                        tr.appendChild(ua_td);
                    }
                    function feedback_priority_str(priority) {
                        switch(priority) {
                            case 'low':
                                return '-';
                                break;
                            case 'medium':
                                return '+';
                                break;
                            case 'high':
                                return '++';
                                break;
                            case 'none':
                                return 'X';
                                break;
                        }
                        return '';
                    }
                    ua_td.innerHTML = ua_td.innerHTML + feedback_priority_str(feedback.priority);
                    ua_td.className = ua_td.className + ` priority_${feedback.priority}`;
                }
            }
        }
    }
}

window.onload = function() {
    httpGetAsync(
        'svg2-new-features-processed.json',
        features_json_received
    );    
}

})();
