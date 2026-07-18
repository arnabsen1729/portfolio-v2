---
title: 'A Beginner-Friendly Introduction to Docker and Containers'
dek: 'A practical primer on containers, namespaces, and Docker fundamentals, from running your first container to writing a Dockerfile and using Docker Compose.'
date: 2023-05-27
tags: ['docker', 'devops', 'tutorial']
---

## What is a Container?

![img](https://arnabsen.dev/images/docker-and-containers/cover.jpg)

You might be familiar with these containers.

These are used for storing stuff and shipping from one place to another. In DevOps, containers have similar applications as well.

**A Container is a way to package an application with all the necessary dependencies and configuration.**

And that package can be portable easily, which makes the process of development and the job of a developer easier.

**What happens in these containers?** Nothing much, just a couple of processes run in isolation on a shared kernel.

**How is it isolated?** The isolation of containers is provided by a Linux feature called *namespaces*. Namespaces partitions kernel resources such that one set of processes sees one set of resources while another set of processes sees a different set of resources. They give the group of running processes an isolated view of the kernel. For example,

| Namespaces | Description |
| --- | --- |
| `PID` | process IDs |
| `USER` | user and group IDs |
| `UTS` | hostname and domain name |
| `NS` | mount points |
| `NET` | Network devices, stacks, ports |

You can use the command `lsns` to get lists of all the currently accessible namespaces.

```bash
$ lsns
        NS TYPE   NPROCS   PID USER    COMMAND
4026531835 cgroup     85  1571 seth /usr/lib/systemd/systemd --user
4026531836 pid        85  1571 seth /usr/lib/systemd/systemd --user
4026531837 user       80  1571 seth /usr/lib/systemd/systemd --user
4026532601 user        1  6266 seth /usr/lib64/firefox/firefox [...]
4026532928 net         1  7164 seth /usr/lib64/firefox/firefox [...]
```

Another feature of the **kernel** is *control groups* (a.k.a `cgroups`) which monitors, limits, accounts for, and isolates the resource usage of a collection of processes (also known as containers)

## Virtual Machine VS Containers

An operating system has two main layers:

1. **OS Kernel:** It communicates with hardware like memory, CPU .etc.
    
2. **Applications Layer:** They run on the Kernel.
    

Linux is a kernel. There are many Linux distributions each looking different from one another because the applications are different. But under the hood, they use the same kernel i.e. Linux.

Coming back to the difference between VM and Containers:-

![img](https://arnabsen.dev/images/docker-and-containers/containers-vs-virtual-machines.jpg)

VM runs on something called *Hypervisor*. Each virtual machine includes a full-blown OS and its process, which are very heavy and slow to start.

Containers on the other hand don't include full-blown OS, only include a set of OS-specific files. They are just processes that share the same kernel with other containers and the isolation by the containers is provided by the Linux namespaces. So since they run on top of the kernel they are very fast and also light-weight. So, we are getting the benefits of isolation by VM without the heaviness that comes with VM

But remember:

> Containers don't replace VMs. Both have their own purpose.

## What is Docker?

An early implementation of container technology was added to **FreeBSD** in **2001**. Whereas Docker debuted to the public in **Santa Clara at PyCon in 2013** and was made open source in **March 2013**. The tooling for using Linux Containers was really lacking and that's where docker comes into play. Basically, **docker is tooling to manage containers.**

**Docker allows developers to package their applications into containers and directly use them in their CI/CD pipeline.**

It helps achieve:

> Build once, run everywhere

## Why should we at all bother?

There are a number of advantages of using Docker and Containerisation: (No wonder it is very popular)

1. You can't say "But... It works on my machine" anymore. Good Luck with that. Because we are packaging the application with all the dependencies and the configurations required, even if it is running on a different machine it will still behave the same way.
    

![Meme](https://arnabsen.dev/images/docker-and-containers/works-on-my-machine.jpeg)

1. **They are very lightweight and fast.** Already discussed this, just adding one thing. The fact that dockers are lightweight is the main reason behind them being so portable. *Obvious*
    
2. **Docker has its own ecosystem** provided by the community and has many tools that come with it, which helps solve a lot of issues.
    

---

Let's get our hands dirty now.

To install docker you can look into the [official docs](https://docs.docker.com/). Else if you want to just try your hands first, then you can use this: [https://labs.play-with-docker.com/](https://labs.play-with-docker.com/)

## Practical 1

Let's go through some popular docker commands. The docker commands are the same for all environments so it won't be an issue.

### Run a container

Run this command

```bash
docker container run -t ubuntu ls
```

`docker container run` will run the image that your provided, in this case, it is `Ubuntu`. Now if you are running this command for the first time high chances are that the image is not downloaded, so it will show something like this:

```bash
Unable to find image 'ubuntu:latest' locally
latest: Pulling from library/ubuntu
```

If you notice something here we just mentioned `ubuntu` not `ubuntu:latest`. If we didn't specify any version it will take the latest version. But if you wanted to use `ubuntu 18.04` you can specify it like this:

```bash
docker container run -t ubuntu:18.04 ls
```

It will again show:

```bash
Unable to find image 'ubuntu:18.04' locally
latest: Pulling from library/ubuntu
```

But this time notice the version. Also in both cases you see an output like this

```bash
bin   dev  home  lib64  mnt  proc  run   srv  tmp  var
boot  etc  lib   media  opt  root  sbin  sys  usr
```

Basically, it is the output of the `ls` command.

Now let's run this command

```bash
docker container run -t ubuntu top
```

And open a new shell and continue. If you are using Play with Docker. Then create a new instance, and then ssh into the previous instance.

![img](https://arnabsen.dev/images/docker-and-containers/practical-11.png)

Now type this command

```bash
$ docker ps
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
6d2a990df65d        ubuntu              "top"               3 seconds ago       Up 2 seconds                            blissful_austin
```

This command shows you the containers and all the necessary information about it.

Usually, containers are used for running a process, maybe a server or some application, and soon as the main process exits the container will stop too. So let's create a very simple process.

So run this command

```bash
docker run -d ubuntu sleep 300
```

Yeah, this is our process, we will ask the container to sleep for 300 secs.

Every container has a unique container id. So in most of the commands which deal with a particular container, we have to provide the container id. Now let's hop into the *sleeping container*.

```bash
docker exec -it 6d2a990df65d bash
```

> **Note:** `6d2a990df65d` is the docker container id in my case. Just do `docker ps` look at the container id and paste it there.

It will spawn a bash terminal inside the container. You can run all the basic commands of Ubuntu.

To get the list of all the containers (even the ones that exited) run

```bash
docker ps -a
```

### Stop a container

To stop the container we need to use `docker stop <container-id-1> <container-id-2>`.

```bash
docker stop 6d2a990df65d d9da0526d987
```

To remove containers you can use `docker system prune`

There is a nice collection of important docker commands by [garystafford](https://gist.github.com/garystafford) [here](https://gist.github.com/garystafford/f0bd5f696399d4d7df0f) which I find very helpful.

### Debugging container

Usually, for debugging, we need to look at the logs. For that use the command:

```bash
docker logs <container-id>
```

Also, `docker exec` sometimes helps in the debugging process.

> **Remember** that containers use kernel-level features to achieve isolation and that containers run on top of the kernel. Your container is just a group of processes running in isolation on the same host, and you can use the command `docker exec` to enter that isolation with the bash process. After you run the command `docker exec`, the group of processes running in isolation (in other words, the container) includes `sleep` and `bash`.

---

## Where are all these images stored?

Docker maintains a public repository of all the images called [Dockerhub](https://hub.docker.com/).

Also, you can run more than one container simultaneously.

While running containers you can do a lot more stuff, like

* `--name` tag will allow you to name the container.
    
* `--detach or -d` will allow you to run the docker in detached mode i.e. in the background.
    
* `--publish or -p` to publish the ports to the host (very important)
    

You can the list of all the options [here](https://docs.docker.com/engine/reference/commandline/run/#options)

Containers are self-contained and isolated, which means you can avoid potential conflicts between containers with different systems or runtime dependencies. You can run multiple NGINX containers that all have port `80` as their default listening ports. If you're exposing the host by using the --publish flag, the ports selected for the host must be unique. Isolation benefits are possible because of Linux namespaces. Running multiple containers on the same host gives us the ability to use the resources (CPU, memory, and so on) available on a single host. This can result in huge cost savings for an enterprise.

Although running images directly from the Docker Store can be useful at times, it is more useful to create custom images and refer to official images as the starting point for these images.

## Docker Images and Docker Containers

Now, if you are confused let's look into the differences between **Docker Images** and **Docker containers**. A docker image is a tar file or an archive of the filesystem or the container. It contains the metadata of the filesystem.

Whereas Container is the running environment of the image. It's the process (isolated process to be specific). The filesystem of the container is virtual, i.e. it has its own abstraction.

Images are used to create containers (more than one). You can consider it as a blueprint. We can share our Docker Image and then we can create containers using the image. We can also push images to the Docker Hub.

## How to create Docker Image?

To create a Docker image, we use a special file called `Dockerfile` (no extension), which consists of a list of commands to build our image. After we have created our image we can pass it to `docker build` which will build the image.

```bash
docker build -f Dockerfile
```

A Docker Image is a set of layers where each layer represents an instruction from the Dockerfile. The layers are stacked on top of each other. Each new layer is only a set of differences from the previous one.

![img](https://arnabsen.dev/images/docker-and-containers/image-layer.png)

The best part of the image layer is that they are cached. If you change say the 5th line then the docker engine will reuse the first 4 layers and then start building from the 5th line. This improves the time during build and also in the context of CI/CD once the base is pushed, the subsequent pushes will be very fast. To optimize the caching, we need to organize the Dockerfile in a way that the line that will change the most is located at the bottom of the Dockerfile.

Let's dive into this.

## Practical 2

### Creating flask application

We are going to create a simple Flask application.

* Download this Python script [https://gist.github.com/arnabsen1729/1fa19228e4451963bbb64563da98f880](https://gist.github.com/arnabsen1729/1fa19228e4451963bbb64563da98f880) and save it as `app.py`.
    
* Install the package `flask` by `pip3 install flask` and run the app `python3 app.py`.
    
* When the app is running you can visit your `0.0.0.0:5000`, you will see `hello world!`.
    

Hence we have set up a basic Flask server. To close this process press `Ctrl+C`.

Now we will dockerize this flask app.

### Building Dockerfile

So create a file `Dockerfile` and open your text editor and paste this

```dockerfile
FROM python:3.6.1-alpine
RUN pip install flask
CMD ["python","app.py"]
COPY app.py /app.py
```

Let's go through this line by line

### `FROM python:3.6.1-alpine`

This is the starting point for your Dockerfile. Every Dockerfile typically starts with a `FROM` line that is the starting image to build your layers on top of. In this case, you are selecting the `python:3.6.1-alpine` base layer because it already has the version of Python and pip that you need to run your application. The Alpine version means that it uses the Alpine distribution, which is significantly smaller than an alternative flavour of Linux. A smaller image means it will download (deploy) much faster, and it is also more secure because it has a smaller attack surface.

> *It is highly recommended to only use official images found in the Docker Hub, or noncommunity images found in the Docker Store.*

### `RUN pip install flask`

The `RUN` the command executes commands needed to set up your image for your application, such as installing packages, editing files, or changing file permissions. In this case, you are installing Flask. The `RUN` commands are executed at build time and are added to the layers of your image. Usually for node applications, this will involve installing all the `node_modules`, if it was a larger Python application, you will have to install those as well.

`CMD ["python", "app.py"]`

`CMD` is the command that is executed when you start a container. Here, you are using CMD to run your Python application. There can be only one `CMD` per Dockerfile.

> *If you specify more than one CMD, then the last CMD will take effect.*

### `COPY app.py /app.py`

This line copies the `app.py` file in the local directory (where you will run the docker image build) into a new layer of the image. This instruction is the last line in the Dockerfile. Layers that change frequently, such as copying source code into the image, should be placed near the bottom of the file to take full advantage of the Docker layer cache. This allows you to avoid rebuilding layers that could otherwise be cached. For instance, if there was a change in the FROM instruction, it will invalidate the cache for all subsequent layers of this image. You'll see this a little later in this lab

But, how can the CMD command run if we are copying the `app.py` later? **CMD is the command that is executed when you start a container**, until and unless you run the container it is not executed. Also since the command to run the application will not change, we have placed it higher.

Here is the list of [all commands](https://docs.docker.com/engine/reference/builder/)

Now to build the image with the `Dockerfile` run

### Running the container

```bash
$ docker build -t flask-app . # if the Dockefile is in that directory
#or
$ docker build -t flask-app -f /path/to/Dockerfile
```

It will pull the `Python:3.6.1-alpine`, and go through the process. In the end it will output something like this

```bash
Successfully built 38f35dd1d2a4
Successfully tagged flask-app:latest
```

Now run the command `docker images` and you will see `flask-app` or whatever name you mentioned in the list. So now you have successfully created the image.

For the final part let's run the container with this image.

```bash
docker run -p5001:5000 -d --name flask-container flask-app
```

What are we doing here?

* `docker run` to run the container
    
* `-p5001:5000` to map port 5000 of our container with 5001 of the host machine
    
* `--name flask-container` giving the name of my container
    
* `flask-app` the image we want to build
    

Now do `docker ps` you will see

```bash
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS                    NAMES
940f215ceea0        flask-app           "python app.py"     2 seconds ago       Up 2 seconds        0.0.0.0:5000->5001/tcp   flask-container
```

Now go to `localhost:5001`, if everything was correct you will see `hello world!`

To check the logs we can run `docker logs`

```bash
$ docker logs flask-container
 * Serving Flask app "app" (lazy loading)
 * Environment: production
   WARNING: This is a development server. Do not use it in a production deployment.
   Use a production WSGI server instead.
 * Debug mode: off
 * Running on http://0.0.0.0:5000/ (Press CTRL+C to quit)
172.17.0.1 - - [03/Jan/2021 14:55:58] "GET / HTTP/1.1" 200 -
172.17.0.1 - - [03/Jan/2021 14:55:59] "GET / HTTP/1.1" 200 -
```

Docker images contain all the dependencies that they need to run an application within the image. This is useful because you no longer need to worry about environment drift (version differences) when you rely on dependencies that are installed on every environment you deploy to. You also don't need to follow more steps to provide these environments. Just one step: install docker, and that's it.

Now if you change the `app.py` only the last step in Dockerfile needs to be updated the rest is already cached.

And you have successfully dockerized your application.

## Docker Compose

Sometimes the docker run command becomes very long and very tedious like sometimes we even need to specify lots of environment variables and stuff. Running those long commands every single time becomes difficult. Also if you are working with let's say 3 or 4 containers then you have to write such long-run commands every single time you want to start the container. So there is a simple way to express the commands in a structured way, save it in a file and simply run that file.

That file is the `docker-compose.yml`. The file is a YAML file. (*Fun fact: full form of YAML is 'YAML Ain't Markup Language' recursive huh!!*)

Writing a `docker-compose` file is not very difficult, you just need to know how to structure it. This article written by Gabriel Tanner explains it nicely.

Link to the article: [gabrieltanner.org/blog/docker-compose](https://gabrieltanner.org/blog/docker-compose)

If you have reached this far and you have understood Docker, it's also important that you keep the best practices in mind. Here is a good guide for that: [spacelift.io/blog/dockerfile#dockerfile-best-practices](http://spacelift.io/blog/dockerfile#dockerfile-best-practices)

## Conclusion

In this article, we learned about Docker and how to dockerize a simple application. We also learned about Docker Compose and how to use it.

A really nice collection of Docker study material is available here: [Docker Handbook 2021 Edition](https://docker.farhan.info/)

Hope you liked my article, do follow me on Hashnode and on Twitter (handle: @ArnabSen1729) for updates.
