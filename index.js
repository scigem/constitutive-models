import Plotly from 'plotly.js-dist';
import css from './main.css';
import exp_data_json from "./data/experimental_data.json"

let current_loading, current_model;
let exp_data;
let de_v, de_s;
let e_v_vec, e_s_vec, p_vec, q_vec;
let exp_traces1 = [];
let exp_traces2 = [];
let exp_traces3 = [];
let exp_traces4 = [];

function linear_elasticity(){
    let K = parseFloat(E.value)*1e9/(3*(1-2*parseFloat(nu.value))); // convert from GPa to Pa
    let G = parseFloat(E.value)*1e9/(2*(1+parseFloat(nu.value))); // convert from GPa to Pa
    let dp = K*de_v;
    let dq = 2*G*de_s;
    // console.log(dp, dq);
    return [dp, dq]
}

function drucker_prager(){
    let K = E.value*1e9/(3*(1-2*nu.value)); // convert from GPa to Pa
    let G = E.value*1e9/(2*(1+nu.value)); // convert from GPa to Pa
    let p = p_vec[p_vec.length - 1];
    let q = q_vec[q_vec.length - 1];
    let de_star = (de_s - (mu.value*K)/(3*G)*de_v)/(1+beta.value*(mu.value*K)/(3*G));
    if ( de_star < 0 ) { de_star = 0 } // apply Macaulay brackets
    let q_on_mu_p_to_s = (q/mu.value/p)**parseFloat(s.value);
    let dp = K*(de_v + beta.value*q_on_mu_p_to_s*q_on_mu_p_to_s*de_star);
    let dq = 3*G*(de_s - q_on_mu_p_to_s*de_star);
    // console.log(s.value)
    // let lambda = (Math.sqrt(6)*G*p*q*de_s - K*q*q*de_v)/(3*G*mu.value*p*p + K*beta.value*q*q);
    // if ( isNaN(lambda) ) { lambda = 0 } // fix divide by zero errors
    // if ( lambda < 0 ) { lambda = 0 } // apply Macaulay brackets
    // let dp = K*(de_v + beta.value*lambda*(q/mu.value/p)**s.value);
    // let dq = 2*G*(de_s - Math.sqrt(6)/2*lambda*(q/mu.value/p)**(s.value-1));
    return [dp, dq]
}

function max(){
    let dp = 0;
    let dq = 0;
    return [dp, dq]
}

function store(dp,dq){
    e_v_vec.push(e_v_vec[e_v_vec.length - 1] + de_v);
    e_s_vec.push(e_s_vec[e_s_vec.length - 1] + de_s);
    p_vec.push(p_vec[p_vec.length - 1] + dp);
    q_vec.push(q_vec[q_vec.length - 1] + dq);
}

function time_march(m) {
    let dp, dq;
    e_v_vec = [0];
    e_s_vec = [0]
    p_vec = [1e-10];
    q_vec = [1e-10];

    current_loading = loading.options[loading.selectedIndex].value;
    if ( current_loading === 'triaxial_drained' ) {
        de_v = 1e-7;
        de_s = 0;
        let p = 0;
        while ( p < parseFloat(p_consolidation.value)) {
            [dp, dq] = m();
            p += dp
            // console.log(p,dp)
            store(dp,dq);
        }
        de_s = 1e-7;
        de_v = 0;
        // de_v = de_s/3.;
        let q = 0;
        while ( q < parseFloat(q_max.value)) {
            [dp, dq] = m();
            q += dq
            // console.log(p,dp)
            store(dp,dq);
        }
    } else if ( current_loading === 'triaxial_undrained' ) {
        alert(current_loading + ' loading not implemented yet');
    } else if ( current_loading === 'isotropic' ) { 
        de_v = 1e-7;
        de_s = 0;
        let p = 0;
        while ( p < parseFloat(p_consolidation.value)) {
            [dp, dq] = m();
            p += dp
            // console.log(p,dp)
            store(dp,dq);
        }
    } else if ( current_loading === 'oedometric' ) {
        alert(current_loading + ' loading not implemented yet');
    }
}

function update() {
    let current_loading = loading.options[loading.selectedIndex].value;
    if ( current_loading === 'triaxial_drained' ) {
        document.getElementById('p_consolidation_div').hidden=false ;
        document.getElementById('q_max_div').hidden=false ;
    } else if ( current_loading === 'triaxial_undrained' ) {
        document.getElementById('p_consolidation_div').hidden=false ;
        document.getElementById('q_max_div').hidden=false ;
    } else if ( current_loading === 'isotropic' ) {
        document.getElementById('p_consolidation_div').hidden=false ;
        document.getElementById('q_max_div').hidden=true ;
    } else if ( current_loading === 'oedometric' ) {
        document.getElementById('p_consolidation_div').hidden=false ;
        document.getElementById('q_max_div').hidden=true ;
    }

    current_model = model.options[model.selectedIndex].value;
    if ( current_model === 'linear_elasticity' ) {
        document.getElementById('E_div').hidden=false ;
        document.getElementById('nu_div').hidden=false ;
        document.getElementById('beta_div').hidden=true ;
        document.getElementById('mu_div').hidden=true ;
        document.getElementById('s_div').hidden=true ;
    } else if ( current_model === 'drucker_prager' ) {
        document.getElementById('E_div').hidden=false ;
        document.getElementById('nu_div').hidden=false ;
        document.getElementById('beta_div').hidden=false ;
        document.getElementById('mu_div').hidden=false ;
        document.getElementById('s_div').hidden=false ;
    } else if ( current_model === 'max' ) {
        document.getElementById('E_div').hidden=false ;
        document.getElementById('nu_div').hidden=false ;
        document.getElementById('beta_div').hidden=true ;
        document.getElementById('mu_div').hidden=false ;
        document.getElementById('s_div').hidden=false ;
    }

    time_march(eval(current_model)); // get reference to the function that defines the constitutive model
    draw_graphs();
    show_exp_data();
}

function show_exp_data(){

}


function draw_graphs(){
    let trace1 = {
        x: e_v_vec,
        y: q_vec,
        type: 'line',
        mode: 'lines',
        line: {
            color: 'E44F35',
            width: 5,
        },
        name: model.options[model.selectedIndex].value
    };
    let layout1 = {
        // width: "10%",
        // height: "100%",
        xaxis: {
            automargin: true,
            title: 'Axial strain (-)',
        },
        yaxis: {
            automargin: true,
            title: 'Deviatoric stress (Pa)',
        }
    }
    let config = {responsive: true}

    if ( exp_data !== undefined ) {
        exp_traces1 = [];
        exp_traces2 = [];
        exp_traces3 = [];
        exp_traces4 = [];
        for ( let t in exp_data ) {
            let test = exp_data[t]
            if ( (current_loading === 'oedometric') && (t.includes('OE')) ) {
                // console.log(t)
                let name = t;
                if ( parseFloat(test.ID0.min) < initial_density.value && parseFloat(test.ID0.max) > initial_density.value) {
                    exp_traces1.push({x: test.eps1.data, y: test.q.data,    type: 'scatter', mode: 'markers', marker: {color: 'black', size: 5}, name: name});
                    exp_traces2.push({x: test.eps1.data, y: test.epsv.data, type: 'scatter', mode: 'markers', marker: {color: 'black', size: 5}, name: name});
                    exp_traces3.push({x: test.p.data,    y: test.q.data,    type: 'scatter', mode: 'markers', marker: {color: 'black', size: 5}, name: name});
                    exp_traces4.push({x: test.p.data,    y: test.epsv.data, type: 'scatter', mode: 'markers', marker: {color: 'black', size: 5}, name: name});
                }
            }
            else if ( (current_loading === 'triaxial_drained') && (t.includes('TMD')) ) {
                let name = '<a href='+test.publication_doi_link+'>'+String(t)+'</a>';
                if ( parseFloat(test.ID0.min) < initial_density.value && parseFloat(test.ID0.max) > initial_density.value) {
                    exp_traces1.push({x: test.eps1.data, y: test.q.data,    type: 'scatter', mode: 'markers', marker: {color: 'black', size: 5}, name: name});
                    exp_traces2.push({x: test.eps1.data, y: test.epsv.data, type: 'scatter', mode: 'markers', marker: {color: 'black', size: 5}, name: name});
                    exp_traces3.push({x: test.p.data,    y: test.q.data,    type: 'scatter', mode: 'markers', marker: {color: 'black', size: 5}, name: name});
                    exp_traces4.push({x: test.p.data,    y: test.epsv.data, type: 'scatter', mode: 'markers', marker: {color: 'black', size: 5}, name: name});
                }
            }
        }
    }
        

    Plotly.react('graph_1', [trace1,...exp_traces1], layout1, config);

    let trace2 = {...trace1 };
    let layout2 = {...layout1 };
    trace2.x = e_s_vec;
    trace2.y = e_v_vec;
    layout2.xaxis.title = 'Axial strain (-)';
    layout2.yaxis.title = 'Volumetric strain (-)';

    Plotly.react('graph_2', [trace2,...exp_traces2], layout2, config);

    let trace3 = {...trace1};
    let layout3 = {...layout1 };
    trace3.x = p_vec;
    trace3.y = q_vec;
    layout3.xaxis.title = 'Pressure (Pa)';
    layout3.yaxis.title = 'Deviatoric stress (Pa)';

    Plotly.react('graph_3', [trace3,...exp_traces3], layout3, config);

    let trace4 = {...trace1 };
    let layout4 = {...layout1 };
    trace4.x = p_vec;
    trace4.y = e_v_vec;
    layout4.xaxis.title = 'Pressure (Pa)';
    layout4.yaxis.title = 'Volumetric strain (-)';

    Plotly.react('graph_4', [trace4,...exp_traces4], layout4, config);

    Plotly.Plots.resize('graph_1')
    Plotly.Plots.resize('graph_2')
    Plotly.Plots.resize('graph_3')
    Plotly.Plots.resize('graph_4')
}

function load_exp_data() {
    fetch('experimental_data.json')
    .then(r => r.json())
    .then(r => { 
        // now sort alphabetically to make things look nice and store as a global variable
        console.log(Object.keys(r))
        exp_data = Object.keys(r).sort().reduce(
            (obj, key) => { 
              obj[key] = r[key]; 
              return obj;
            }, 
            {}
          );
        draw_graphs(); })
    .catch(e => console.warn(e));
}

function init() {
    load_exp_data()

    var elements = document.getElementsByClassName("updater");
    Array.from(elements).forEach(function(element) {
        element.addEventListener('input', update);
    });

    let urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('model')) {
        model.value = urlParams.get('model');
    }
    if ( urlParams.has('loading') ) {
        loading.value = urlParams.get('loading');
    }

    update();
}

init();