import Plotly from 'plotly.js-dist';
import css from './main.css';

let de_v, de_a;
let e_v_vec, e_a_vec, p_vec, q_vec;

function linear_elasticity(){
    let K = parseFloat(E.value)*1e6/(3*(1-2*parseFloat(nu.value))); // convert from GPa to kPa
    let G = parseFloat(E.value)*1e6/(2*(1+parseFloat(nu.value))); // convert from GPa to kPa
    let dp = K*de_v;
    let dq = 2*G*de_a;
    // console.log(dp, dq);
    return [dp, dq]
}

function drucker_prager(){
    // NOTE: THIS IS TOTALLY BROKEN, JUST A SUGGESTION FOR HOW TO IMPLEMENT THINGS
    let K = E.value*1e6/(3*(1-2*nu.value)); // convert from GPa to kPa
    let G = E.value*1e6/(2*(1+nu.value)); // convert from GPa to kPa
    let p = p_vec[p_vec.length - 1];
    let q = q_vec[q_vec.length - 1];
    
    let lambda = (Math.sqrt(6)*G*p*q*de_a - K*q*q*de_v)/(3*G*mu.value*p*p + K*beta.value*q*q);
    if ( isNaN(lambda) ) { lambda = 0 }
    if ( lambda < 0 ) { lambda = 0 }
    let dp = K*(de_v + beta.value*lambda*(q/mu.value/p)**s.value);
    let dq = 2*G*(de_a - Math.sqrt(6)/2*lambda*(q/mu.value/p)**(s.value-1));
    return [dp, dq]
    
}

function max(){
    let dp = 0;
    let dq = 0;
    return [dp, dq]
}

function store(dp,dq){
    e_v_vec.push(e_v_vec[e_v_vec.length - 1] + de_v);
    e_a_vec.push(e_a_vec[e_a_vec.length - 1] + de_a);
    p_vec.push(p_vec[p_vec.length - 1] + dp);
    q_vec.push(q_vec[q_vec.length - 1] + dq);
}

function time_march(m) {
    let dp, dq;
    e_v_vec = [0];
    e_a_vec = [0]
    p_vec = [1e-5];
    q_vec = [1e-5];

    let current_loading = loading.options[loading.selectedIndex].value;
    if ( current_loading === 'triaxial_drained' ) {
        de_v = 1e-3;
        de_a = 0;
        for (let i=0; i<10; i++){
            [dp, dq] = m();
            store(dp,dq);
        }
        de_v = 0;
        de_a = 1e-3;
        for (let i=0; i<100; i++){
            [dp, dq] = m();
            store(dp,dq);
        }
    } else if ( current_loading === 'triaxial_undrained' ) {
        alert(current_loading + ' loading not implemented yet');
    } else if ( current_loading === 'isotropic' ) { 
        de_v = 1e-3;
        de_a = 0;
        for (let i=0; i<100; i++){
            [dp, dq] = m();
            store(dp,dq);
        }
    } else if ( current_loading === 'oedometric' ) {
        alert(current_loading + ' loading not implemented yet');
    }




    
}

function update() {
    let current_model = model.options[model.selectedIndex].value;
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
}


function draw_graphs(){
    let trace1 = {
        x: e_v_vec,
        y: q_vec,
    };
    let layout = {
        // width: "10%",
        // height: "100%",
        xaxis: {
            automargin: true,
            title: 'Axial strain (%)',
        },
        yaxis: {
            automargin: true,
            title: 'Deviatoric stress (kPa)',
        }
    }
    let config = {responsive: true}

    Plotly.react('graph_1', [trace1], layout, config);

    let trace2 = {...trace1};
    trace2.x = p_vec;
    trace2.y = q_vec;
    layout.xaxis.title = 'Pressure (kPa)';
    layout.yaxis.title = 'Deviatoric stress (kPa)';

    Plotly.react('graph_2', [trace2], layout, config);

    let trace3 = {...trace1 };
    trace3.x = e_a_vec;
    trace3.y = e_v_vec;
    layout.xaxis.title = 'Axial strain (%)';
    layout.yaxis.title = 'Volumetric strain (%)';

    Plotly.react('graph_3', [trace3], layout, config);

    let trace4 = {...trace1 };
    trace3.x = e_a_vec;
    trace3.y = e_v_vec;
    layout.xaxis.title = 'Axial strain (%)';
    layout.yaxis.title = 'Volumetric strain (%)';

    Plotly.react('graph_4', [trace4], layout, config);

    Plotly.Plots.resize('graph_1')
    Plotly.Plots.resize('graph_2')
    Plotly.Plots.resize('graph_3')
    Plotly.Plots.resize('graph_4')
}

update();

var elements = document.getElementsByClassName("updater");
Array.from(elements).forEach(function(element) {
    element.addEventListener('input', update);
});