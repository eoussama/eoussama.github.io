---
title: Admin system for beginners
date: 2016-10-04T11:51:00Z
summary: A beginner’s admin system for a SA-MP server, with levels saved through y_ini and a /setlevel command built with ZCMD and sscanf2.
note: Posted on the SA-MP forums three days after my first tutorial.
tags: [Pawn, "SA:MP"]
---

Howdy,

So a lot of people were requesting this on this forums, on social medias, even on ******* comments, So I thought that here I should step forward and tutor others who aren't aware of such technics to do certain things,

so hope you guys enjoy...

## Requirements

the last version of sscanf, [http://download2124.mediafire.com/h22chck23wxg/bfp2h0d4231jjdr/sscanf2_03dR2-500.800-dneeTHA.rar](http://download2124.mediafire.com/h22chck23wxg/bfp2h0d4231jjdr/sscanf2_03dR2-500.800-dneeTHA.rar)

ZCMD : [https://sampforum.blast.hk/showthread.php?tid=91354](https://sampforum.blast.hk/showthread.php?tid=91354)

YSI\y_ini : [https://sampforum.blast.hk/showthread.php?tid=570957](https://sampforum.blast.hk/showthread.php?tid=570957)

## Tutorial

### Including the libraries

So first of all, you must include the new installed files, they should go beneath the a_samp include,

```pawn
#include <a_samp>
#include <ZCMD>
#include <sscanf2>
#include <YSI\y_ini>
```

### Where the levels are saved

now, if we are going to do this, let's make it perfect, we want to make the admin status auto acquired by admins when logging-in, thus we must save the data somewhere, so let's define the path of the data saving,

```pawn
#define ADMIN_PATH "/Admins/%s.ini"
```

Ok, now we want to rename the data-holding file to the player's name, to do so, insert the following code,

```pawn
AdminPath(playerid) {
	new
	    str[36],
	    name[MAX_PLAYER_NAME];
	GetPlayerName(playerid, name, sizeof(name));
	format(str, sizeof(str), ADMIN_PATH, name);
	return str;
}
```

you might have a palm face now, and say, wait..w.wwhat? Wth just happened, well, just chill mate, and let me start explaining what the code above stands for,

so as you can see, we created a string named "str" and set it's size to 36, and the other  variable to hold the player's name which is "name" and its size is MAX_PLAYER_NAME, which is by default equal to 24,

after that, we stored the player's name in the variable "name", then comes the "format", which replaces the file's name with the player's name, so that we will final have a .ini file with the player's name,

let's move on.

### The admin data

Now we need to declare new variables, so let's got ahead and use the enum function

```pawn
enum E_ADMIN_DATA {
	AdminLevel,
	bool:LoggedIn
}
```

so we've created the "AdminLevel" variable and the "LoggedIn" boolean, which is by default set to false,

underneath of that, do this:

```pawn
new PlayerInfo[MAX_PLAYER_NAME][E_ADMIN_DATA];
```

OK, now he are done with the first part, make sure that your script look like this :

```pawn
#include <a_samp>
#include <ZCMD>
#include <sscanf2>
#include <YSI\y_ini>

#define ADMIN_PATH "/Admins/%s.ini"

AdminPath(playerid) {
	new
	    str[36],
	    name[MAX_PLAYER_NAME];
	GetPlayerName(playerid, name, sizeof(name));
	format(str, sizeof(str), ADMIN_PATH, name);
	return str;
}
enum E_ADMIN_DATA {
	AdminLevel,
	bool:LoggedIn
}
new PlayerInfo[MAX_PLAYER_NAME][E_ADMIN_DATA];
```

### Loading a level on connect

before you do anything, go to "scriptfiles" and create a new folder, thennamed it "Admins"

now, moving the second part, go to the OnPlayerConnect(playerid) callback, and type this:

```pawn
PlayerInfo[playerid][AdminLevel] = 0;
PlayerInfo[playerid][LoggedIn] = false;
```

what the first line means is, when a player their stats would be reseted concerning their AdminLevel until their identify get confirmed, (world perfectly with a login system),

right underneath that, insiter the following,

```pawn
	GetPlayerName(playerid, name, sizeof(name));
	if(fexist(AdminPath(playerid))) {
	    INI_ParseFile(AdminPath(playerid), "LoadPlayerData_AdminData", .bExtra = true, .extra = playerid);
	}
```

so this part should look like this:

```pawn
public OnPlayerConnect(playerid)
{
	PlayerInfo[playerid][AdminLevel] = 0;
	PlayerInfo[playerid][LoggedIn] = false;
	new name[MAX_PLAYER_NAME];
	GetPlayerName(playerid, name, sizeof(name));
	if(fexist(AdminPath(playerid))) {
	    INI_ParseFile(AdminPath(playerid), "LoadPlayerData_AdminData", .bExtra = true, .extra = playerid);
	}
	return 1;
}
```

that part was all about reseting the player's stats and checking if they previousely have an admin data file,

the INI_ParseFile function is calling a forwarded callback, which we are about to creat,

next, go ahead bellow thes OnPlayerConnect callback and forward,

```pawn
forward LoadPlayerData_AdminData(playerid, name[], value[]);
```

now right below this, type the following code,

```pawn
public LoadPlayerData_AdminData(playerid, name[], value[]) {
	INI_Int("AdminLevel", PlayerInfo[playerid][AdminLevel]);
	return 1;
}
```

that callback above stands for making the admin level data stored in form of an integer, that's why we had in the biggining INI_**Int**

### The /setlevel command

OK, now we made the necessary part, let's do the setlevel command next,

this is going to work for both level 4 admins and rcon admins, therefore the code should look like this,

```pawn
CMD:setlevel(playerid, params[]) {
	if(IsPlayerAdmin(playerid) || PlayerInfo[playerid][AdminLevel] >= 3)
	{
               //do something here
               return 1;
        else {
		SendClientMessage(playerid, 0xFF0000, "[ERROR]: you are not authorized to use this command");
		return 1;
	}
}
```

next define some variables,

```pawn
CMD:setlevel(playerid, params[]) {
	if(IsPlayerAdmin(playerid) || PlayerInfo[playerid][AdminLevel] >= 3)
	{
               new
			string[MAX_PLAYER_NAME+64],
			pname[MAX_PLAYER_NAME],
			tname[MAX_PLAYER_NAME],
			targetid,
		 	level;
               //do something here
               return 1;
        else {
		SendClientMessage(playerid, 0xFF0000, "[ERROR]: you are not authorized to use this command");
		return 1;
	}
}
```

**string[MAX_PLAYER_NAME+64] :** a string which is going to be used to display a message, its size is ([MAX_PLAYER_NAME] = 24)+64 which is 88

**pname[MAX_PLAYER_NAME] :** a variable which will hold the player's name (the admin who is using the command), its size is 24

**tname[MAX_PLAYER_NAME] :** a variable that holds the target id's name (the player whom is going to be promoted/demoted), its size is 24

**targetid :** self-explanatory, a variable which helps define the target's id,

**level :** this will hold the value of the admin level you want to stick to someone,

### Checking the parameters

next step, we are goin to tell the server what to do in case a player uses the command with null parameters, and where comes sscanf's role, so type this in your code

```pawn
if(sscanf(params, "ii", targetid, level))
        {
            return SendClientMessage(playerid, -1, "USAGE: /setlevel (playerid) (level)");
        }
```

then your code should look like this:

```pawn
CMD:setlevel(playerid, params[]) {
	if(IsPlayerAdmin(playerid) || PlayerInfo[playerid][AdminLevel] >= 3)
	{
                 new
			string[MAX_PLAYER_NAME+64],
			pname[MAX_PLAYER_NAME],
			tname[MAX_PLAYER_NAME],
			targetid,
		 	level;
                        if(sscanf(params, "ii", targetid, level))
                        {
                                return SendClientMessage(playerid, -1, "USAGE: /setlevel (playerid) (level)");
                        }
                        //do something here
                        return 1;
        else {
		SendClientMessage(playerid, 0xFF0000, "[ERROR]: you are not authorized to use this command");
		return 1;
	}
}
```

what we've done so far, is sending a client message to the user "USAGE:..etc" in case he didn't add the command params,

### Checking the target and the level

so next, we need to check if the targetid(the promoted/demoted guy) is connected or has a valid ID,

in order to do this, we need to loop through all connected players one by one, and the fast way to do this is using "for" statement, so we need to add this,

```pawn
for(new i=0;i<MAX_PLAYERS; i++) continue; {

	     if((!IsPlayerConnected(targetid)) || (targetid == INVALID_PLAYER_ID))
            {
                    SendClientMessage(playerid, 0xFF0000, "Player Is Not Connected!");
            }
}
if(level < 1 || level > 4)
{
        return SendClientMessage( playerid, 0xFF0000, "available levels (1-4)");
}
```

OK, let's freez a minute and explain the content above,

so first we started the code line with **for**, which stands for a **loop**, and what loop besically is? a loop is a sequence of instruction s that is continually repeated until a certain condition is reached, in this case, the targetid, so we typed **new i = 0**, whioch creates a new variable "i" and sets its value to 0, then we typed **i&lt;MAX_PLAYERS**, which sets the limite of "i" to the max players connected, so now the value of "i"is closed between 0 and MAX_PLAYERS, next we typed, **i++**, which tells the server to add 1 to the value of "i" every time, then we finished the line with **continue**, your code will stop and start again at the start of the loop, skipping everything else after the _continue;_

then we made a limite to admin levels, (1-4),

once you do all of this, your code should look like this:

```pawn
CMD:setlevel(playerid, params[])
{
    if((IsPlayerAdmin(playerid)) || PlayerInfo[playerid][AdminLevel] >= 3)
    {
        new
             string[MAX_PLAYER_NAME+64],
             pname[MAX_PLAYER_NAME],
             tname[MAX_PLAYER_NAME],
             targetid,
             level;

	if(sscanf(params, "ii", targetid, level))
        {
            return SendClientMessage(playerid, -1, "USAGE: /setlevel (playerid) (level)");
        }
        for(new i=0;i<MAX_PLAYERS; i++) continue; {
                if((!IsPlayerConnected(targetid)) || (targetid == INVALID_PLAYER_ID))
                {
                        SendClientMessage(playerid, 0xFF0000, "Player Is Not Connected!");
                }
         }
	 if(level < 1 || level > 4)
        {
        	return SendClientMessage( playerid, 0xFF0000, "available levels (1-4)");
	}
    }
    else
    {
         SendClientMessage( playerid, 0xFF0000, "you can't use this command!");
         return 1;
    }
    return 1;
}
```

### Setting and saving the level

and now let's sent the players admin level,

first, let's store the player and target's names in their variables,

```pawn
GetPlayerName(playerid, pname, sizeof(pname));
GetPlayerName(targetid, tname, sizeof(tname));
```

then send a client message to all, so players would notice the promotion,

```pawn
format(string, sizeof(string), "Administrator %s has promoted %s to level %i admin", pname, tname, level);
SendClientMessageToAll(-1, string);
```

now to set the player's level, just type this

```pawn
PlayerInfo[targetid][AdminLevel] = level;
```

we still missing the most important part, which is saving the data, do to so, we're going to use YSI\y_ini,

```pawn
new INI:File = INI_Open(AdminPath(targetid));
INI_SetTag(File, "AdminData");
INI_WriteInt(File, "AdminLevel", PlayerInfo[targetid][AdminLevel]);
INI_Close(File);
```

so far, your overall command code, should look like this,

```pawn
CMD:setlevel(playerid, params[])
{
    if((IsPlayerAdmin(playerid)) || PlayerInfo[playerid][AdminLevel] >= 3)
    {
        new
             string[MAX_PLAYER_NAME+64],
             pname[MAX_PLAYER_NAME],
             tname[MAX_PLAYER_NAME],
             targetid,
             level;

		if(sscanf(params, "ii", targetid, level))
        {
            return SendClientMessage(playerid, -1, "USAGE: /setlevel (playerid) (level)");
        }
        for(new i=0;i<MAX_PLAYERS; i++) continue; {
                 if((!IsPlayerConnected(targetid)) || (targetid == INVALID_PLAYER_ID))
                {
                       SendClientMessage(playerid, 0xFF0000, "Player Is Not Connected!");
                }
	}
        if(level < 1 || level > 4)
        {
        	return SendClientMessage( playerid, 0xFF0000, "available levels (1-4)");
        }

        else
        {
            GetPlayerName(playerid, pname, sizeof(pname));
            GetPlayerName(targetid, tname, sizeof(tname));
            format(string, sizeof(string), "Administrator %s has promoted %s to level %i admin", pname, tname, level);
            SendClientMessageToAll(-1, string);
            PlayerInfo[targetid][AdminLevel] = level;
            new INI:File = INI_Open(AdminPath(targetid));
            INI_SetTag(File, "AdminData");
            INI_WriteInt(File, "AdminLevel", PlayerInfo[targetid][AdminLevel]);
            INI_Close(File);
            return 1;
        }
    }
    else
    {
         SendClientMessage( playerid, 0xFF0000, "you can't use this command!");
         return 1;
    }
    return 1;
}
```

all the data would be saved in "_scriptfiles > Admins_"

hope I helped most of you guys,

_if you find this useful, give it a +REQ_

regards, oussama

---

_First published on the SA-MP forums in October 2016. The [original thread](https://sampforum.blast.hk/showthread.php?tid=618311) lives on in the forum’s archive._
