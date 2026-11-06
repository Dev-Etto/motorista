package t;
import android.app.Activity;import android.content.Context;import android.graphics.*;import android.os.*;import android.view.*;import android.widget.*;
public class Main extends Activity {
  Handler h=new Handler(Looper.getMainLooper());int left=15;
  @Override protected void onCreate(Bundle b){super.onCreate(b);
    String mode=getIntent().getStringExtra("mode"); if(mode==null)mode="home";
    if(mode.equals("canvas")){setContentView(new Card(this));return;}
    if(mode.equals("split")||mode.equals("bid")||mode.equals("route")){
      LinearLayout o=new LinearLayout(this);o.setOrientation(1);o.setPadding(40,120,40,40);
      add(o,"Saldo");add(o,"R$ 55,00");
      o.addView(new View(this),new LinearLayout.LayoutParams(-1,700));
      String[] t=mode.equals("route")?new String[]{"8 min","3,3 km","5 min","1,1 km","R$ 2,3/km","~3,3 km","R$ 10","2 min.","Aceitar por R$ 10","Pular"}:mode.equals("split")?new String[]{"R$","11,20","12","min","3","km","8","min","5","km","Aceitar"}:new String[]{"R$ 3/km","~2,2 km","R$ 13","5.0 (16)","2 min.","Aceitar por R$ 13","R$ 14,50","R$ 16","Pular"};
      for(String x:t)add(o,x);
      setContentView(o);return;}
    LinearLayout l=new LinearLayout(this);l.setOrientation(1);l.setPadding(40,120,40,40);
    add(l,"Ganhos de hoje");add(l,"R$ 120,00");
    View space=new View(this);l.addView(space,new LinearLayout.LayoutParams(-1,900));
    if(mode.equals("trip")||mode.equals("idle")){
      TextView c=add(l,"15 min");
      if(mode.equals("trip"))add(l,"Finalizar corrida");
      h.post(new Runnable(){public void run(){c.setText(left+" min");left=left>0?left-1:15;h.postDelayed(this,400);}});
    } else if(!mode.equals("home")){
      TextView c=add(l,"15");
      add(l,"UberX");add(l,"R$ 18,40");add(l,"4,92");add(l,"5 min (2,1 km) de distância");add(l,"Viagem de 14 min (6,4 km)");
      if(mode.equals("button"))add(l,"Aceitar");
      h.post(new Runnable(){public void run(){c.setText(String.valueOf(left));left=left>0?left-1:15;h.postDelayed(this,100);}});
    }
    setContentView(l);}
  TextView add(LinearLayout l,String s){TextView t=new TextView(this);t.setText(s);t.setTextSize(22);t.setTextColor(Color.BLACK);l.addView(t);return t;}
  static class Card extends View{Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);Card(Context c){super(c);setBackgroundColor(Color.WHITE);p.setTextSize(72);p.setColor(Color.BLACK);}
    @Override protected void onDraw(Canvas c){String[] s={"UberX","R$ 18,40","5 min (2,1 km) de distância","Viagem de 14 min (6,4 km)","Aceitar"};int y=1300;for(String x:s){c.drawText(x,60,y,p);y+=120;}}}
}
