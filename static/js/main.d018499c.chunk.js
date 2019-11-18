(this["webpackJsonploan-amortisation"]=this["webpackJsonploan-amortisation"]||[]).push([[0],{38:function(e,t,a){e.exports=a(58)},43:function(e,t,a){},46:function(e,t,a){},58:function(e,t,a){"use strict";a.r(t);var n=a(0),l=a.n(n),r=a(15),s=a.n(r),i=(a(43),a(21)),o=a(28),c=a(29),m=a(36),u=a(30),d=a(13),h=a(37),p=a(8),y=a.n(p),E=a(5),g=a(35),v=a(32),f=a(6),b=a(9),C=a(22),S=a(18),x=a(23),k=a(34),I=a(10),D=a.n(I),N=(a(45),a(46),"loan-state"),F={Weekly:7,Fortnightly:14},O=function(){try{var e=sessionStorage.getItem(N);if(null==e)return;return JSON.parse(e)}catch(t){return}},G=function(e){function t(e){var a;return Object(o.a)(this,t),(a=Object(m.a)(this,Object(u.a)(t).call(this,e))).state={amount:"",date:"",rate:"",compounds:"",repayment:"",repaydate:"",repayfreq:"",enddate:"",display:"daily",summary:{},schedule:void 0},a.handleChange=a.handleChange.bind(Object(d.a)(a)),a.generate=a.generate.bind(Object(d.a)(a)),a}return Object(h.a)(t,e),Object(c.a)(t,[{key:"componentDidMount",value:function(){void 0!==O()&&this.setState(O())}},{key:"handleChange",value:function(e){var t=e.target,a=t.name,n=t.id,l=t.value;a?this.setState(Object(i.a)({},a,l)):this.setState(Object(i.a)({},n,l))}},{key:"repaymentDates",value:function(){var e=[];if(!this.shouldGenerateSchedule())return e;var t=y()(this.state.enddate);e.push(y()(this.state.repaydate));var a=y()(this.state.repaydate);if("Monthly"===this.state.repayfreq)for(a.add(1,"months");a.isSameOrBefore(t);)e.push(y()(a)),a.add(1,"months");else for(a.add(F[this.state.repayfreq],"days");a.isSameOrBefore(t);)e.push(y()(a)),a.add(F[this.state.repayfreq],"days");return e}},{key:"isCompoundingDate",value:function(e){return"month"===this.state.compounds?1===e.date():this.isRepaymentDate(e)}},{key:"isRepaymentDate",value:function(e){return void 0!==this.repaymentDates().find((function(t){return e.isSame(t,"day")}))}},{key:"shouldGenerateSchedule",value:function(){if(Object.values(this.state).every((function(e){return""!==e}))){var e=y()(this.state.date),t=y()(this.state.repaydate),a=y()(this.state.enddate);return e.isBefore(y()("2019-01-01"))?(this.setState({incomplete:!0}),!1):a.isAfter(y()(e).add(5,"years"))?(this.setState({incomplete:!0}),!1):t.isBefore(e)||a.isBefore(e)?(this.setState({incomplete:!0}),!1):(this.setState({incomplete:!1}),!0)}return this.setState({incomplete:!0}),!1}},{key:"dailyInterest",value:function(e){var t=D()(this.state.rate);return t=t.div(100),e.times(t).div(365)}},{key:"generate",value:function(){if(function(e){try{var t=JSON.stringify(e);sessionStorage.setItem(N,t)}catch(a){console.log("error saving state to sessionStorage",N,e)}}(this.state),this.shouldGenerateSchedule()){for(var e=D()(this.state.amount),t=this.dailyInterest(e),a=y()(this.state.enddate),n=D()(0),l=D()(0),r=[],s={samount:e.toFixed(2),interest:D()(0),repayment:D()(0)},i=y()(this.state.date);i.isSameOrBefore(a);i.add(1,"days"))this.isRepaymentDate(i)&&(e=e.minus(this.state.repayment),t=this.dailyInterest(e),s.repayment=s.repayment.add(this.state.repayment)),this.isCompoundingDate(i)&&(e=e.plus(n),l=n,n=D()(0),t=this.dailyInterest(e)),n=n.add(t),s.interest=s.interest.add(t),("monthly"===this.state.display&&this.isCompoundingDate(i)||"daily"===this.state.display)&&r.push({date:i.format("YYYY-MM-DD"),balance:e.toFixed(2),accrued:n.toFixed(2),paccrued:l.toFixed(2),daily:t.toFixed(2),repayment:this.isRepaymentDate(i),compounding:this.isCompoundingDate(i)});e=e.plus(n),r.push({date:"Final Balance",balance:e.toFixed(2),accrued:"",daily:""}),s.principal=s.repayment.minus(s.interest).toFixed(2),s.interest=s.interest.toFixed(2),s.repayment=s.repayment.toFixed(2),s.sdate=this.state.date,s.edate=this.state.enddate,s.amount=this.state.amount,s.display=this.state.display,this.setState({schedule:r,summary:s})}else this.setState({schedule:void 0})}},{key:"renderDailySchedule",value:function(){return l.a.createElement(C.a,{responsive:!0,hover:!0,size:"sm"},l.a.createElement("thead",null,l.a.createElement("tr",null,l.a.createElement("th",null,"Date"),l.a.createElement("th",null,"Daily Interest"),l.a.createElement("th",null,"Accrued Interest"),l.a.createElement("th",null,"Loan Balance"))),l.a.createElement("tbody",null,this.state.schedule.map((function(e,t){var a=e.repayment?"table-success":"";a=e.compounding?"table-danger":a;var n=e.repayment?"Repayment today":"";return n=e.compounding?"Interest compounds today":n,l.a.createElement("tr",{className:a,key:t,title:n},l.a.createElement("td",null,e.date),l.a.createElement("td",{className:"text-right"},e.daily),l.a.createElement("td",{className:"text-right"},e.accrued),l.a.createElement("td",{className:"text-right"},e.balance))}))))}},{key:"renderMonthlySchedule",value:function(){return l.a.createElement(C.a,{responsive:!0,hover:!0,size:"sm"},l.a.createElement("thead",null,l.a.createElement("tr",null,l.a.createElement("th",null,"Date"),l.a.createElement("th",{className:"text-right"},"Interest (previous period)"),l.a.createElement("th",{className:"text-right"},"Loan Balance"))),l.a.createElement("tbody",null,this.state.schedule.map((function(e,t){return l.a.createElement("tr",{key:t},l.a.createElement("td",null,e.date),l.a.createElement("td",{className:"text-right"},e.paccrued),l.a.createElement("td",{className:"text-right"},e.balance))}))))}},{key:"render",value:function(){return l.a.createElement(v.a,null,l.a.createElement("h1",null,"Generate a Loan Amortisation Schedule"),l.a.createElement("br",null),this.state.incomplete&&l.a.createElement(g.a,{variant:"danger"},"Please enter valid values in ",l.a.createElement("strong",null,"every")," field."),l.a.createElement(b.a,null,l.a.createElement(f.a,null,l.a.createElement("p",null,"Fill out all fields in the form below and the amortisation schedule will automatically generate."),l.a.createElement(E.a,null,l.a.createElement(b.a,null,l.a.createElement(f.a,null,l.a.createElement(E.a.Group,{controlId:"amount"},l.a.createElement(E.a.Label,null,"Loan Amount"),l.a.createElement(E.a.Control,{type:"number",min:"0",value:this.state.amount,onChange:this.handleChange}),l.a.createElement(E.a.Text,{className:"text-muted"},"This should be the starting loan amount, or an amount taken from a statement on a date which interest was charged (ie no accrued interest)."))),l.a.createElement(f.a,null,l.a.createElement(E.a.Group,{controlId:"date"},l.a.createElement(E.a.Label,null,"as at"),l.a.createElement(E.a.Control,{type:"date",placeholder:"Enter the date that your loan was this amount.",value:this.state.date,onChange:this.handleChange}),l.a.createElement(E.a.Text,{className:"text-muted"},"Earliest permitted date is 1/1/2019.")))),l.a.createElement(b.a,null,l.a.createElement(f.a,null,l.a.createElement(E.a.Group,{controlId:"rate"},l.a.createElement(E.a.Label,null,"Interest Rate"),l.a.createElement(S.a,{className:"mb-3"},l.a.createElement(E.a.Control,{placeholder:"Enter interest rate",type:"number",step:"0.01",value:this.state.rate,onChange:this.handleChange}),l.a.createElement(S.a.Append,null,l.a.createElement(S.a.Text,null,"%"))))),l.a.createElement(f.a,null,l.a.createElement(E.a.Group,{controlId:"compounds"},l.a.createElement(E.a.Label,null,"Interest Compounds"),l.a.createElement(E.a.Control,{as:"select",placeholder:"When does interest compound?",value:this.state.compounds,onChange:this.handleChange},l.a.createElement("option",null),l.a.createElement("option",{value:"month"},"1st of the Month"),l.a.createElement("option",{value:"repayment"},"Same day as repayments"))))),l.a.createElement(b.a,null,l.a.createElement(f.a,null,l.a.createElement(E.a.Group,{controlId:"repayment"},l.a.createElement(E.a.Label,null,"Repayment Amount"),l.a.createElement(E.a.Control,{placeholder:"Enter repayment amount",value:this.state.repayment,onChange:this.handleChange}))),l.a.createElement(f.a,null,l.a.createElement(E.a.Group,{controlId:"repayfreq"},l.a.createElement(E.a.Label,null,"Repayment Frequency"),l.a.createElement(E.a.Control,{as:"select",placeholder:"Select repayment frequency",value:this.state.repayfreq,onChange:this.handleChange},l.a.createElement("option",null),l.a.createElement("option",null,"Weekly"),l.a.createElement("option",null,"Fortnightly"),l.a.createElement("option",null,"Monthly"))))),l.a.createElement(b.a,null,l.a.createElement(f.a,null,l.a.createElement(E.a.Group,{controlId:"repaydate"},l.a.createElement(E.a.Label,null,"Next Repayment Date"),l.a.createElement(E.a.Control,{type:"date",placeholder:"Enter next repayment date",value:this.state.repaydate,onChange:this.handleChange}))),l.a.createElement(f.a,null,l.a.createElement(E.a.Group,{controlId:"enddate"},l.a.createElement(E.a.Label,null,"Loan Refinance Date"),l.a.createElement(E.a.Control,{type:"date",placeholder:"Enter the date fixed loan is to be refinanced",value:this.state.enddate,onChange:this.handleChange}),l.a.createElement(E.a.Text,{className:"text-muted"},"No more than 5 years from the start date.")))),l.a.createElement(E.a.Group,{controlId:"enddate"},l.a.createElement(E.a.Label,null,"Generate Schedule"),l.a.createElement("div",{key:"inline-radio",className:"mb-3"},l.a.createElement(E.a.Check,{inline:!0,label:"Daily",name:"display",value:"daily",type:"radio",onChange:this.handleChange,id:"gen-daily"}),l.a.createElement(E.a.Check,{inline:!0,label:"Weekly / Fortnightly / Monthly",name:"display",value:"monthly",type:"radio",onChange:this.handleChange,id:"gen-monthly"}))),l.a.createElement(k.a,{variant:"success",onClick:this.generate},"Create Schedule")),l.a.createElement("br",null),l.a.createElement("p",null,"Assumptions:"),l.a.createElement("ul",null,l.a.createElement("li",null,"Interest accrued daily."),l.a.createElement("li",null,"Daily interest is calculated after adding repayment or interest compounding adjustment."))),this.state.schedule&&0!==this.state.schedule.length&&l.a.createElement(f.a,null,l.a.createElement(x.a,null,l.a.createElement(x.a.Body,null,l.a.createElement("h5",null,"Summary"),l.a.createElement(b.a,null,l.a.createElement(f.a,null,"Start date:"),l.a.createElement(f.a,null,this.state.summary.sdate)),l.a.createElement(b.a,null,l.a.createElement(f.a,null,"End date:"),l.a.createElement(f.a,null,this.state.summary.edate)),l.a.createElement(b.a,null,l.a.createElement(f.a,null,"Start balance:"),l.a.createElement(f.a,null,"$",this.state.summary.amount)),l.a.createElement(b.a,null,l.a.createElement(f.a,null,"End balance:"),l.a.createElement(f.a,null,"$",this.state.schedule[this.state.schedule.length-1].balance)),l.a.createElement(b.a,null,l.a.createElement(f.a,null,"Total repayments:"),l.a.createElement(f.a,null,"$",this.state.summary.repayment)),l.a.createElement(b.a,null,l.a.createElement(f.a,null,"Total interest:"),l.a.createElement(f.a,null,"$",this.state.summary.interest)),l.a.createElement(b.a,null,l.a.createElement(f.a,null,"Total principal paid:"),l.a.createElement(f.a,null,"$",this.state.summary.principal)))),"daily"===this.state.summary.display&&this.renderDailySchedule(),"monthly"===this.state.summary.display&&this.renderMonthlySchedule())))}}]),t}(n.Component);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));s.a.render(l.a.createElement(G,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()}))}},[[38,1,2]]]);
//# sourceMappingURL=main.d018499c.chunk.js.map