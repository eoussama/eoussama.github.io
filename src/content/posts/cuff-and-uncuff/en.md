---
title: /cuff and /uncuff (sscanf + ZCMD)
date: 2016-10-01T14:58:00Z
summary: My first tutorial, a /cuff and /uncuff for the police in a SA-MP server, built with sscanf2 and ZCMD.
note: My first tutorial, posted on the SA-MP forums in October 2016.
tags: [Pawn, "SA:MP"]
---

Howdy, so guys this is my first tutorial here, Hope you guys enjoy,

Today I'm going to show you, in brief, how to make a very simple and accurate /cuff or /uncuff system

**NOTE:** _I'm not going to disable the player's controllability when cuffed, It will just tie his the target's hands so he won't fire a gun_

before you do anything, make sure you have sscanf2 and ZCMD available in your script folder,

if you don't have there, you can download them from here,

> SSCANF2 : [https://sampforum.blast.hk/showthread.php?tid=570927](https://sampforum.blast.hk/showthread.php?tid=570927)
>
> ZCMD : [http://www.solidfiles.com/d/d20f/](http://www.solidfiles.com/d/d20f/)

first of all, underneath **#include &lt;a_samp>** include the zcmd and sscanf2 includes, so it would look like this

```pawn
#include <a_samp>
#include <zcmd>
#include <sscanf2>
```

After that, add a boolean to help you define whether the target is cuffed or not, name it whatever you see fit, for the sake of this tutorial Imma do it like the following

```pawn
new bool:IsCuffed[MAX_PLAYERS];
```

by default, this boolean is set to _false_, so we need to declare which conditions that would turn it _true_

before we do that, we need to make sure that players won't get Cuffed automatically when they log-in, so we need to go under **OnPlayerConnect** Callback and set the previous boolean to _false_

```pawn
public OnPlayerConnect(playerid)
{
      IsCuffed[playerid] = false;
      return 1;
}
```

that should do,

Before we start working on Commands, make sure that you already have a class system containing different classes, for example, "LSPD and Robbers/Gangsters..." and this is mandatory considering the fact that logically only cops can perform this action(cuff/uncuff)

so once you make your class system, (for this tutorial I'm using // LSPD referring to cops // and // GANG referring to outlawed persons), which means, I would have two new variables defined on my script

```pawn
#define LSPD 0
#define GANG 1
```

Next start making the commands,

so in the first line, declare the cuff command

<pre class="hand"><code><span style="color: darkorange">CMD:cuff(playerid, params[])
{
      <span style="color: seagreen">// do something here</span>
      return 1;
}</span></code></pre>

This creates the command, but it has no functionality yet,

so after the player enters the command, the server would check if that player is in LSPD class, then execute the command, but if he's not in LSPD class, the server would display an error, It would look like the following

<pre class="hand"><code>CMD:cuff(playerid, params[])
{
     <span style="color: darkorange"> if(gTeam[playerid] == LSPD)
      {
            <span style="color: seagreen">// do something here</span>
            return 1;
      }</span>
      <span style="color: darkorange">else if(gTeam[playerid] != LSPD)
      {
            SendClientMessage(playerid, 0xFF0000, "[ERROR]: Only cops and use this command!");
            return 1;
      }
      return 1;</span>
}</code></pre>

Ok, now we gave the permission for only LSPD member to use that command,

next, let's define the target id(the person whom we're going to cuff) and make it as if the player doesn't enter the params(if he only typed /cuff without typing any ID), the server would give him an Error

<pre class="hand"><code>CMD:cuff(playerid, params[])
{
      if(gTeam[playerid] == LSPD)
      {
           <span style="color: darkorange"> new targetid;
            if(sscanf(params, "u", targetid)) return SendClientMessage(playerid, 0xFF00FF, "USAGE: /cuff (PlayerID)");
            return 1;</span>
      }
      else if(gTeam[playerid] != LSPD)
      {
            <span style="color: darkorange">SendClientMessage(playerid, 0xFF0000, "[ERROR]: Only cops and use this command!");
            return 1;</span>
      }
      return 1;
}</code></pre>

The **"u"** stands for the target's ID parameter,

next, let's and see if that player is online or not,

<pre class="hand"><code>CMD:cuff(playerid, params[])
{
      if(gTeam[playerid] == LSPD)
      {
            new targetid;
            if(sscanf(params, "u", targetid)) return SendClientMessage(playerid, 0xFF00FF, "USAGE: /cuff (PlayerID)");
             <span style="color: darkorange">if(IsPlayerConnected(targetid))
            {
                   <span style="color: seagreen">// do something here</span>
                   return 1;
            }
            else if(!IsPlayerConnected(targetid))
           {
                   SendClientMessage(playerid, 0xFF0000, "[ERROR]: Invalid ID!");
                   return 1!
           }
            return 1;</span>
      }
      else if(gTeam[playerid] != LSPD)
      {
            SendClientMessage(playerid, 0xFF0000, "[ERROR]: Only cops and use this command!");
            return 1;
      }
      return 1;
}</code></pre>

Ok here is a problem, if we don't add any other conditions, and just executed the command, the target would be cuffed whatever the distance between the player and the target is, so let's limit the use of this in a specific distance,

<pre class="hand"><code>CMD:cuff(playerid, params[])
{
      if(gTeam[playerid] == LSPD)
      {
            new targetid;
            if(sscanf(params, "u", targetid)) return SendClientMessage(playerid, 0xFF00FF, "USAGE: /cuff (PlayerID)");
             if(IsPlayerConnected(targetid))
            {
                   <span style="color: darkorange">new Float:x, Float:y, Float:z;
                   GetPlayerPos(targetid, x, y, z);
                   if(IsPlayerInRangeOfPoint(playerid, 5, x, y, z))
                   {
                          <span style="color: seagreen">// do something here</span>
                          return 1;
                   }
                   else if(!IsPlayerInRangeOfPoint(playerid, 5, x, y, z))
                   {
                          SendClientMessage(playerid, 0xFF0000, "[ERROR]: That player is too far away from you!");
                          return 1;
                   }
                   return 1;</span>
            }
            else if(!IsPlayerConnected(targetid))
           {
                   SendClientMessage(playerid, 0xFF0000, "[ERROR]: Invalid ID!");
                   return 1!
           }
            return 1;
      }
      else if(gTeam[playerid] != LSPD)
      {
            SendClientMessage(playerid, 0xFF0000, "[ERROR]: Only cops and use this command!");
            return 1;
      }
      return 1;
}</code></pre>

So the last part was all about the distance between the two players, so I created 3 floats _"x, y, z"_ then I assigned them to the target's position, after that I used them to specify the position of the limit distance range between the player and the target,

and now, we need to check if the target belongs to the LSPD class himself too, so he won't be cuffed, (it makes sense actually :D)

<pre class="hand"><code>CMD:cuff(playerid, params[])
{
      if(gTeam[playerid] == LSPD)
      {
            new targetid;
            if(sscanf(params, "u", targetid)) return SendClientMessage(playerid, 0xFF00FF, "USAGE: /cuff (PlayerID)");
             if(IsPlayerConnected(targetid))
            {
                   new Float:x, Float:y, Float:z;
                   GetPlayerPos(targetid, x, y, z);
                   if(IsPlayerInRangeOfPoint(playerid, 5, x, y, z))
                   {
                          <span style="color: darkorange">if(gTeam[playerid] != LSPD)
                          {
                                 <span style="color: seagreen">// do something here</span>
                                 return 1;
                          }
                          else if(gTeam[playerid] == LSPD)
                          {
                                  SendClientMessage(playerid, 0xFF0000, "[ERROR]: you can't cuff a law enforcer!");
                                  return 1;
                          {
                          return 1;</span>
                   }
                   else if(!IsPlayerInRangeOfPoint(playerid, 5, x, y, z))
                   {
                          SendClientMessage(playerid, 0xFF0000, "[ERROR]: That player is too far away from you!");
                          return 1;
                   }
                   return 1;
            }
            else if(!IsPlayerConnected(targetid))
           {
                   SendClientMessage(playerid, 0xFF0000, "[ERROR]: Invalid ID!");
                   return 1!
           }
            return 1;
      }
      else if(gTeam[playerid] != LSPD)
      {
            SendClientMessage(playerid, 0xFF0000, "[ERROR]: Only cops and use this command!");
            return 1;
      }
      return 1;
}</code></pre>

So what we've done so far is, making it impossible to cuff an LSPD member, so the "**gTeam[playerid] != LSPD**"

checks if the target is NOT a LSPD member, then if it's true, the command will execute, but if it's false(which's declared on **gTeam[playerid] == LSPD**) the command would give an error message,

and now, the last step before executing the command, is to check if the target is already cuffed or not,

<pre class="hand"><code>CMD:cuff(playerid, params[])
{
      if(gTeam[playerid] == LSPD)
      {
            new targetid;
            if(sscanf(params, "u", targetid)) return SendClientMessage(playerid, 0xFF00FF, "USAGE: /cuff (PlayerID)");
             if(IsPlayerConnected(targetid))
            {
                   new Float:x, Float:y, Float:z;
                   GetPlayerPos(targetid, x, y, z);
                   if(IsPlayerInRangeOfPoint(playerid, 5, x, y, z))
                   {
                          if(gTeam[playerid] != LSPD)
                          {
                                <span style="color: darkorange"> if(IsCuffed == false)
                                 {
                                        <span style="color: seagreen">// do something here</span>
                                        return 1;
                                 }
                                 else if(IsCuffed[targetid] == true)
                                 {
                                        SendClientMessage(playerid, 0xFF0000, "[ERROR]: This player is already cuffed!");
                                        return 1;
                                 }                            
                                 return 1;</span>
                          }
                          else if(gTeam[playerid] == LSPD)
                          {
                                  SendClientMessage(playerid, 0xFF0000, "[ERROR]: you can't cuff a law enforcer!");
                                  return 1;
                          {
                          return 1;
                   }
                   else if(!IsPlayerInRangeOfPoint(playerid, 5, x, y, z))
                   {
                          SendClientMessage(playerid, 0xFF0000, "[ERROR]: That player is too far away from you!");
                          return 1;
                   }
                   return 1;
            }
            else if(!IsPlayerConnected(targetid))
           {
                   SendClientMessage(playerid, 0xFF0000, "[ERROR]: Invalid ID!");
                   return 1!
           }
            return 1;
      }
      else if(gTeam[playerid] != LSPD)
      {
            SendClientMessage(playerid, 0xFF0000, "[ERROR]: Only cops and use this command!");
            return 1;
      }
      return 1;
}</code></pre>

and here we have made use of that boolean which we've created at the beginning, so we made it as if the target is cuffed already, the command would fail and give an error message, but in case the target isn't cuffed, the command would execute just fine,

and now, let's add some functionality to the command,

<pre class="hand"><code>CMD:cuff(playerid, params[])
{
      if(gTeam[playerid] == LSPD)
      {
            new targetid;
            if(sscanf(params, "u", targetid)) return SendClientMessage(playerid, 0xFF00FF, "USAGE: /cuff (PlayerID)");
             if(IsPlayerConnected(targetid))
            {
                   new Float:x, Float:y, Float:z;
                   GetPlayerPos(targetid, x, y, z);
                   if(IsPlayerInRangeOfPoint(playerid, 5, x, y, z))
                   {
                          if(gTeam[playerid] != LSPD)
                          {
                                 if(IsCuffed[targetid] == false)
                                 {
                                       <span style="color: darkorange"> new string[64+MAX_PLAYER_NAME]
                                        new targetname[MAX_PLAYER_NAME]
                                        new playername[MAX_PLAYER_NAME]
                                        GetPlayerName(playerid, playername, sizeof(playername)
                                        format(string, sizeof(string), "You have been cuffed by officer %s",playername));
                                        SendClientMessage(targetid, 0x0000FF, string);
                                        GetPlayerName(targetid, targetname, sizeof(targetname))
                                        format(string, sizeof(string), "You have cuffed %s ", targetname))
                                        SendClientMessage(playerid, 0xCCFF00, string));                                      SetPlayerAttachedObject(targetid,8,19418,6,-0.031999,0.024000,-0.024000,-7.900000,-32.000011,-72.299987,1.115998,1.322000,1.406000);
    	 				SetPlayerSpecialAction(targetid, SPECIAL_ACTION_CUFFED);
                                        IsCuffed = true;
                                        return 1;</span>
                                 }
                                 else if(IsCuffed == true)
                                 {
                                        SendClientMessage(playerid, 0xFF0000, "[ERROR]: This player is already cuffed!");
                                        return 1;
                                 }                            
                                 return 1;
                          }
                          else if(gTeam[playerid] == LSPD)
                          {
                                  SendClientMessage(playerid, 0xFF0000, "[ERROR]: you can't cuff a law enforcer!");
                                  return 1;
                          {
                          return 1;
                   }
                   else if(!IsPlayerInRangeOfPoint(playerid, 5, x, y, z))
                   {
                          SendClientMessage(playerid, 0xFF0000, "[ERROR]: That player is too far away from you!");
                          return 1;
                   }
                   return 1;
            }
            else if(!IsPlayerConnected(targetid))
           {
                   SendClientMessage(playerid, 0xFF0000, "[ERROR]: Invalid ID!");
                   return 1!
           }
            return 1;
      }
      else if(gTeam[playerid] != LSPD)
      {
            SendClientMessage(playerid, 0xFF0000, "[ERROR]: Only cops and use this command!");
            return 1;
      }
      return 1;
}</code></pre>

so basically, we have set the target's animation to **SPECIAL_ACTION_CUFFED** which makes him unable to shoot with a gun, and to make it more realistic we attached a cuffs object to his hands,

I want you to make attention to this, I stated on the command lines, this "**IsCuffed = true;**" that part looked very casual, but it holds a very important value for the command to work properly, so as in the beginning I set the the boolean's value to false whenever someone connects to the server, and when this command is used on him, the boolean would be turned to true, this part is very mandatory for the uncuff command as well,

So, to make the uncuff command, It's pretty much the same, just do everything exactly as the cuff command, but you have to change some parts, exactly like the following

<pre class="hand"><code>CMD:<span style="color: green">uncuff</span>(playerid, params[])
{
      if(gTeam[playerid] == LSPD)
      {
            new targetid;
            if(sscanf(params, "u", targetid)) return SendClientMessage(playerid, 0xFF00FF, "<span style="color: green">USAGE: /uncuff (PlayerID)</span>");
             if(IsPlayerConnected(targetid))
            {
                   new Float:x, Float:y, Float:z;
                   GetPlayerPos(targetid, x, y, z);
                   if(IsPlayerInRangeOfPoint(playerid, 5, x, y, z))
                   {
                          if(gTeam[playerid] != LSPD)
                          {
                                 if(<span style="color: green">IsCuffed[targetid] == true</span>)
                                 {
                                       <span style="color: darkorange"> new string[64+MAX_PLAYER_NAME]
                                        new targetname[MAX_PLAYER_NAME]
                                        new playername[MAX_PLAYER_NAME]
                                        GetPlayerName(playerid, playername, sizeof(playername)
                                        format(string, sizeof(string), "<span style="color: green">You have been uncuffed by officer %s</span>",playername));
                                        SendClientMessage(targetid, 0x0000FF, string);
                                        GetPlayerName(targetid, targetname, sizeof(targetname))
                                        format(string, sizeof(string), "<span style="color: green">You have uncuffed %s </span>", targetname))
                                        SendClientMessage(playerid, 0xCCFF00, string));
                                       <span style="color: green"> if(IsPlayerAttachedObjectSlotUsed(targetid, 8)) 
                                        {
				                 RemovePlayerAttachedObject(targetid, 8);
                                                 return 1;
					}
			         	SetPlayerSpecialAction(targetid, SPECIAL_ACTION_NONE);</span>
                                        <span style="color: royalblue">IsCuffed = false;</span>
                                        return 1;</span>
                                 }
                                 else if(IsCuffed == true)
                                 {
                                        SendClientMessage(playerid, 0xFF0000, "[ERROR]: <span style="color: seagreen">This player is not cuffed</span>!");
                                        return 1;
                                 }                            
                                 return 1;
                          }
                          else if(gTeam[playerid] == LSPD)
                          {
                                  SendClientMessage(playerid, 0xFF0000, "[ERROR]: <span style="color: seagreen">you can't use this on a law enforcer!</span>");
                                  return 1;
                          {
                          return 1;
                   }
                   else if(!IsPlayerInRangeOfPoint(playerid, 5, x, y, z))
                   {
                          SendClientMessage(playerid, 0xFF0000, "[ERROR]: That player is too far away from you!");
                          return 1;
                   }
                   return 1;
            }
            else if(!IsPlayerConnected(targetid))
           {
                   SendClientMessage(playerid, 0xFF0000, "[ERROR]: Invalid ID!");
                   return 1!
           }
            return 1;
      }
      else if(gTeam[playerid] != LSPD)
      {
            SendClientMessage(playerid, 0xFF0000, "[ERROR]: Only cops and use this command!");
            return 1;
      }
      return 1;
}</code></pre>

Ok, those parts that must be changed from the uncuff command are few, I highlighted them in green to label them so you can notice them clearly, but the reason why labeled "IsCuffed = false" with a different color, is to emphasise how important it is to do that is the right place, also, the orange parts must remain as they are, so the command would work smoothly and as it should,

so that was it, I hope you guys found this very helpful, and caught your eyes, if I had suppoort and possitive responds, I would make more tutorials in the very soon,

stay smiley stay happy, and hoipe for the best, so long

---

_First published on the SA-MP forums in October 2016. The [original thread](https://sampforum.blast.hk/showthread.php?tid=618127) lives on in the forum’s archive._
